"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import type { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { transformToWebContainerFormat } from "../hooks/transformer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TerminalComponent, { type TerminalRef } from "./terminal";
import {
    PreviewMessageType,
    WebContainer,
    type PreviewMessage,
} from "@webcontainer/api";

interface WebContainerPreviewProps {
    playgroundId?: string;
    templateData: TemplateFolder;
    serverUrl: string | null;
    isLoading: boolean;
    error: string | null;
    instance: WebContainer | null;
    writeFileSync: (path: string, content: string) => Promise<void>;
    forceResetup?: boolean;
    refreshKey?: number;
}

interface StartConfig {
    scriptName: "dev" | "start" | "serve";
    supportsHmr: boolean;
}

const HMR_COMMAND_PATTERNS = [
    "vite",
    "next dev",
    "react-scripts",
    "tsx watch",
    "nodemon",
    "ng serve",
    "vue-cli-service",
    "turbopack",
    "--watch",
];

const WEBCONTAINER_ENV: Record<string, string> = {
    NEXT_TELEMETRY_DISABLED: "1",
    BROWSER: "none",
    DISABLE_ESLINT_PLUGIN: "true",
};

const SETUP_MARKER_FILE = ".codesphere-playground-id";
const DEPS_MARKER_FILE = ".codesphere-deps-installed";

const ANSI_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

function formatPreviewArg(arg: unknown): string {
    if (typeof arg === "string") return arg;
    if (arg instanceof Error) return arg.stack || arg.message || String(arg);
    if (arg && typeof arg === "object") {
        const record = arg as Record<string, unknown>;
        if (typeof record.message === "string" && record.message.trim()) {
            return record.message;
        }
        try {
            return JSON.stringify(arg);
        } catch {
            return String(arg);
        }
    }
    return String(arg);
}

function extractTerminalLine(chunk: string): string | null {
    const clean = chunk.replace(ANSI_REGEX, "").replace(/\r/g, "\n");
    const lines = clean
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 2 && !/^[\\|/\-⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]+$/.test(line));
    return lines.length > 0 ? lines[lines.length - 1] : null;
}

function resolveStartConfig(packageJsonRaw: string): StartConfig {
    try {
        const parsed = JSON.parse(packageJsonRaw) as {
            scripts?: Record<string, string>;
        };
        const scripts = parsed.scripts ?? {};

        const scriptName: StartConfig["scriptName"] = scripts.dev
            ? "dev"
            : scripts.start
                ? "start"
                : scripts.serve
                    ? "serve"
                    : "start";

        const command = String(scripts[scriptName] ?? "").toLowerCase();
        const supportsHmr = HMR_COMMAND_PATTERNS.some((pattern) =>
            command.includes(pattern)
        );

        return { scriptName, supportsHmr };
    } catch {
        return { scriptName: "start", supportsHmr: false };
    }
}

const WebContainerPreview: React.FC<WebContainerPreviewProps> = ({
    playgroundId = "default",
    templateData,
    error,
    instance,
    isLoading,
    serverUrl,
    forceResetup = false,
    refreshKey = 0,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string>(serverUrl ?? "");
    const [previewRevision, setPreviewRevision] = useState(0);
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);
    const [currentStep, setCurrentStep] = useState(serverUrl ? 4 : 0);
    const [progressPercent, setProgressPercent] = useState(serverUrl ? 100 : 0);
    const [statusMessage, setStatusMessage] = useState<string>(
        serverUrl ? "Server ready" : "Initializing WebContainer..."
    );
    const [setupError, setSetupError] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState(Boolean(serverUrl));

    const terminalRef = useRef<TerminalRef | null>(null);
    const serverProcessRef = useRef<{ kill: () => void } | null>(null);
    const setupStartedForRef = useRef<string | null>(null);
    const serverUrlRef = useRef<string | null>(serverUrl);
    const templateDataRef = useRef<TemplateFolder>(templateData);
    templateDataRef.current = templateData;
    const hasTemplateData = Boolean(templateData);
    const startConfigRef = useRef<StartConfig>({
        scriptName: "start",
        supportsHmr: false,
    });
    const hmrNeedsRecoveryRef = useRef(false);
    const { resolvedTheme } = useTheme();
    const activeTheme: "light" | "dark" =
        resolvedTheme === "light" ? "light" : "dark";

    const advanceProgress = (target: number) => {
        setProgressPercent((prev) => Math.max(prev, Math.min(100, target)));
    };

    const logStep = (message: string, writeLine = true) => {
        setStatusMessage(message);
        if (writeLine) {
            terminalRef.current?.writeToTerminal?.(`\r\n${message}\r\n`);
        }
    };

    useEffect(() => {
        setIsIframeLoaded(false);
    }, [previewUrl, previewRevision]);

    useEffect(() => {
        serverUrlRef.current = serverUrl;
        if (!serverUrl) return;
        setPreviewUrl((prev) => (prev === serverUrl ? prev : serverUrl));
        setCurrentStep(4);
        setProgressPercent(100);
        setStatusMessage("Server ready");
        setIsSetupComplete(true);
    }, [serverUrl]);

    useEffect(() => {
        if (forceResetup) {
            serverProcessRef.current?.kill();
            serverProcessRef.current = null;
            setupStartedForRef.current = null;
            setIsSetupComplete(false);
            setPreviewUrl("");
            setCurrentStep(0);
            setProgressPercent(0);
            setStatusMessage("Resetting environment...");
        }
    }, [forceResetup]);

    useEffect(() => {
        if (!instance || !hasTemplateData) return;
        if (setupStartedForRef.current === playgroundId && !forceResetup) return;

        let cancelled = false;
        let unsubscribeServerReady: (() => void) | null = null;
        let unsubscribePreviewMessage: (() => void) | null = null;
        let unsubscribeContainerError: (() => void) | null = null;
        setupStartedForRef.current = playgroundId;

        async function setupContainer() {
            if (!instance) return;

            try {
                setSetupError(null);
                setPreviewError(null);

                unsubscribeServerReady = instance.on(
                    "server-ready",
                    (port: number, url: string) => {
                        if (cancelled) return;
                        console.log(`Server ready on port ${port} at ${url}`);
                        logStep(`🌐 Server ready at ${url}`);
                        serverUrlRef.current = url;
                        setPreviewError(null);
                        setPreviewUrl(url);
                        setPreviewRevision((revision) => revision + 1);
                        setCurrentStep(4);
                        setProgressPercent(100);
                        setIsSetupComplete(true);
                    }
                );

                unsubscribePreviewMessage = instance.on(
                    "preview-message",
                    (message: PreviewMessage) => {
                        if (cancelled) return;
                        if (message.type === PreviewMessageType.UncaughtException) {
                            const detail = message.message || "Uncaught exception in preview";
                            hmrNeedsRecoveryRef.current = true;
                            terminalRef.current?.writeToTerminal?.(`\r\n❌ Preview uncaught error: ${detail}\r\n`);
                            setPreviewError(detail);
                        } else if (message.type === PreviewMessageType.UnhandledRejection) {
                            const detail = message.message || "Unhandled promise rejection in preview";
                            hmrNeedsRecoveryRef.current = true;
                            terminalRef.current?.writeToTerminal?.(`\r\n❌ Preview rejection: ${detail}\r\n`);
                            setPreviewError(detail);
                        } else if (message.type === PreviewMessageType.ConsoleError) {
                            const detail =
                                message.args?.map((arg) => formatPreviewArg(arg)).join(" ") ||
                                "Console error";
                            if (/\[hmr\]\s*failed to reload|error:/i.test(detail)) {
                                hmrNeedsRecoveryRef.current = true;
                            }
                            terminalRef.current?.writeToTerminal?.(`\r\n⚠️ Preview console.error: ${detail}\r\n`);
                        }
                    }
                );

                unsubscribeContainerError = instance.on("error", ({ message }) => {
                    if (cancelled) return;
                    terminalRef.current?.writeToTerminal?.(`\r\n❌ WebContainer error: ${message}\r\n`);
                    setSetupError(message);
                });

                // Check existing container state for this exact playground
                let alreadyMounted = false;
                let depsAlreadyInstalled = false;
                let existingPackageJson = "";

                if (!forceResetup) {
                    try {
                        const [packageJsonRaw, mountedId] = await Promise.all([
                            instance.fs.readFile("package.json", "utf8"),
                            instance.fs.readFile(SETUP_MARKER_FILE, "utf8"),
                        ]);

                        if (
                            packageJsonRaw &&
                            mountedId.trim() === playgroundId
                        ) {
                            alreadyMounted = true;
                            existingPackageJson = packageJsonRaw;

                            try {
                                const depsMarker = await instance.fs.readFile(
                                    DEPS_MARKER_FILE,
                                    "utf8"
                                );
                                if (depsMarker.trim() === playgroundId) {
                                    depsAlreadyInstalled = true;
                                }
                            } catch {
                                depsAlreadyInstalled = false;
                            }
                        }
                    } catch {
                        alreadyMounted = false;
                        depsAlreadyInstalled = false;
                    }
                }

                if (alreadyMounted && serverUrlRef.current) {
                    startConfigRef.current = resolveStartConfig(existingPackageJson);
                    logStep("🔄 Reconnecting to running WebContainer server...");
                    setPreviewUrl(serverUrlRef.current);
                    setPreviewRevision((revision) => revision + 1);
                    setCurrentStep(4);
                    setProgressPercent(100);
                    setIsSetupComplete(true);
                    return;
                }

                let startConfig: StartConfig;

                if (!alreadyMounted) {
                    // Step 1: Transform data
                    setCurrentStep(1);
                    advanceProgress(15);
                    logStep("🔄 Transforming template data...");

                    const files = transformToWebContainerFormat(
                        templateDataRef.current
                    );
                    if (cancelled) return;

                    // Step 2: Mount files
                    setCurrentStep(2);
                    advanceProgress(30);
                    logStep("📁 Mounting files to WebContainer...");

                    await instance.mount(files);
                    await instance.fs.writeFile(SETUP_MARKER_FILE, playgroundId);
                    if (cancelled) return;

                    try {
                        existingPackageJson = await instance.fs.readFile(
                            "package.json",
                            "utf8"
                        );
                    } catch {
                        existingPackageJson = "";
                    }
                    startConfig = resolveStartConfig(existingPackageJson);
                    startConfigRef.current = startConfig;

                    logStep("✅ Files mounted successfully");
                } else {
                    startConfig = resolveStartConfig(existingPackageJson);
                    startConfigRef.current = startConfig;
                }

                if (!depsAlreadyInstalled) {
                    // Step 3: Install dependencies
                    setCurrentStep(3);
                    advanceProgress(45);
                    logStep("📦 Installing dependencies (npm install)...");

                    const installProcess = await instance.spawn(
                        "npm",
                        ["install", "--no-audit", "--no-fund", "--loglevel=info"],
                        {
                            env: WEBCONTAINER_ENV,
                            terminal: { cols: 80, rows: 24 },
                        }
                    );

                    let lastInstallTick = 0;
                    installProcess.output
                        .pipeTo(
                            new WritableStream({
                                write(data) {
                                    terminalRef.current?.writeToTerminal?.(data);
                                    const line = extractTerminalLine(data);
                                    if (line) {
                                        setStatusMessage(line);
                                    }
                                    const now = Date.now();
                                    if (now - lastInstallTick > 350) {
                                        lastInstallTick = now;
                                        setProgressPercent((prev) =>
                                            prev < 75 ? prev + 1 : prev
                                        );
                                    }
                                },
                            })
                        )
                        .catch(() => undefined);

                    const installExitCode = await installProcess.exit;
                    if (cancelled) return;

                    if (installExitCode !== 0) {
                        throw new Error(
                            `Failed to install dependencies. Exit code: ${installExitCode}`
                        );
                    }

                    await instance.fs.writeFile(DEPS_MARKER_FILE, playgroundId);
                    advanceProgress(80);
                    logStep("✅ Dependencies installed successfully");
                } else {
                    advanceProgress(80);
                    logStep("✅ Using installed dependencies");
                }

                // Step 4: Start the appropriate server script (dev / start / serve)
                setCurrentStep(4);
                advanceProgress(85);
                logStep(`🚀 Starting server (npm run ${startConfig.scriptName})...`);

                serverProcessRef.current?.kill();
                const startProcess = await instance.spawn(
                    "npm",
                    ["run", startConfig.scriptName],
                    {
                        env: WEBCONTAINER_ENV,
                        terminal: { cols: 80, rows: 24 },
                    }
                );
                serverProcessRef.current = startProcess;

                let lastStartTick = 0;
                startProcess.output
                    .pipeTo(
                        new WritableStream({
                            write(data) {
                                terminalRef.current?.writeToTerminal?.(data);
                                const line = extractTerminalLine(data);
                                if (line) {
                                    setStatusMessage(line);
                                    const lower = line.toLowerCase();
                                    if (lower.includes("compiling") || lower.includes("building")) {
                                        advanceProgress(92);
                                    } else if (lower.includes("ready") || lower.includes("started")) {
                                        advanceProgress(96);
                                    }
                                }
                                const now = Date.now();
                                if (now - lastStartTick > 350) {
                                    lastStartTick = now;
                                    setProgressPercent((prev) =>
                                        prev < 95 ? prev + 1 : prev
                                    );
                                }
                            },
                        })
                    )
                    .catch(() => undefined);

                const startExitCode = await startProcess.exit;
                if (
                    !cancelled &&
                    !serverUrlRef.current &&
                    startExitCode !== 0
                ) {
                    throw new Error(
                        `Server exited with code ${startExitCode}. Check terminal output for details.`
                    );
                }
            } catch (err) {
                if (cancelled) return;
                console.error("Error setting up container:", err);
                const errorMessage =
                    err instanceof Error ? err.message : String(err);

                logStep(`❌ Error: ${errorMessage}`);
                setupStartedForRef.current = null;
                setSetupError(errorMessage);
            }
        }

        setupContainer();

        return () => {
            cancelled = true;
            if (unsubscribeServerReady) {
                unsubscribeServerReady();
            }
            if (unsubscribePreviewMessage) {
                unsubscribePreviewMessage();
            }
            if (unsubscribeContainerError) {
                unsubscribeContainerError();
            }
            if (!serverUrlRef.current) {
                setupStartedForRef.current = null;
            }
        };
    }, [instance, playgroundId, hasTemplateData, forceResetup]);

    // Backend servers without HMR/file-watching (such as plain `node index.js`
    // in Express) need a process restart after a saved change. Frameworks with
    // HMR/watch mode (Next.js, Vite, Hono tsx watch) update automatically when
    // writeFileSync writes to WebContainer FS, unless a prior HMR failure left
    // the preview runtime stuck — in which case reload the iframe once cleanly.
    useEffect(() => {
        if (!instance || !isSetupComplete || refreshKey === 0) return;
        setPreviewError(null);

        if (startConfigRef.current.supportsHmr) {
            if (hmrNeedsRecoveryRef.current) {
                hmrNeedsRecoveryRef.current = false;
                const reloadTimer = setTimeout(() => {
                    setPreviewRevision((revision) => revision + 1);
                }, 150);
                return () => clearTimeout(reloadTimer);
            }
            return;
        }

        const webcontainer = instance;
        const scriptName = startConfigRef.current.scriptName;

        async function restartServer() {
            try {
                serverProcessRef.current?.kill();
                const process = await webcontainer.spawn(
                    "npm",
                    ["run", scriptName],
                    {
                        env: WEBCONTAINER_ENV,
                        terminal: { cols: 80, rows: 24 },
                    }
                );
                serverProcessRef.current = process;

                process.output
                    .pipeTo(
                        new WritableStream({
                            write(data) {
                                terminalRef.current?.writeToTerminal?.(data);
                            },
                        })
                    )
                    .catch(() => undefined);
            } catch (restartError) {
                const message =
                    restartError instanceof Error
                        ? restartError.message
                        : "Unable to restart the preview server";
                setSetupError(message);
            }
        }

        restartServer();
    }, [instance, isSetupComplete, refreshKey]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-4 bg-background">
                <div className="text-center space-y-4 max-w-md p-6 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_16px_rgba(15,23,42,0.04)] dark:shadow-none">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <h3 className="text-lg font-medium text-foreground">
                        Initializing WebContainer
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Setting up the environment for your project...
                    </p>
                </div>
            </div>
        );
    }

    if (error || setupError) {
        return (
            <div className="h-full flex items-center justify-center p-4 bg-background">
                <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-6 rounded-xl max-w-md shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle className="h-5 w-5" />
                        <h3 className="font-semibold">Error</h3>
                    </div>
                    <p className="text-sm">{error || setupError}</p>
                </div>
            </div>
        );
    }

    const getStepIcon = (stepIndex: number) => {
        if (stepIndex < currentStep) {
            return (
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            );
        } else if (stepIndex === currentStep) {
            return (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
            );
        } else {
            return (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
            );
        }
    };

    const getStepText = (stepIndex: number, label: string) => {
        const isActive = stepIndex === currentStep;
        const isComplete = stepIndex < currentStep;

        return (
            <span
                className={`text-sm font-medium ${isComplete
                    ? "text-emerald-700 dark:text-emerald-400"
                    : isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    }`}
            >
                {label}
            </span>
        );
    };

    return (
        <div className="h-full w-full flex flex-col bg-background">
            {!previewUrl ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-md p-6 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_16px_rgba(15,23,42,0.04)] dark:shadow-sm">
                        <div className="flex items-center justify-between gap-3 text-xs font-medium mb-2">
                            <span
                                className="truncate text-muted-foreground"
                                title={statusMessage}
                            >
                                {statusMessage}
                            </span>
                            <span className="shrink-0 tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                                {progressPercent}%
                            </span>
                        </div>

                        <Progress value={progressPercent} className="h-2 mb-6" />

                        <div className="space-y-4 mb-2">
                            <div className="flex items-center gap-3">
                                {getStepIcon(1)}
                                {getStepText(1, "Transforming template data")}
                            </div>
                            <div className="flex items-center gap-3">
                                {getStepIcon(2)}
                                {getStepText(2, "Mounting files")}
                            </div>
                            <div className="flex items-center gap-3">
                                {getStepIcon(3)}
                                {getStepText(3, "Installing dependencies")}
                            </div>
                            <div className="flex items-center gap-3">
                                {getStepIcon(4)}
                                {getStepText(4, "Starting development server")}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative flex-1 bg-background">
                    <iframe
                        key={previewRevision}
                        src={previewUrl}
                        allow="cross-origin-isolated"
                        onLoad={() => setIsIframeLoaded(true)}
                        className="w-full h-full border-none bg-white [color-scheme:only_light]"
                        title="WebContainer Preview"
                    />
                    {previewError && (
                        <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 shadow-md dark:border-red-900/60 dark:bg-red-950/95 dark:text-red-200">
                            <div className="min-w-0">
                                <p className="font-semibold">Preview runtime error</p>
                                <p className="mt-0.5 break-words opacity-90">{previewError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewError(null)}
                                className="shrink-0 rounded px-1.5 py-0.5 font-medium hover:bg-red-200/60 dark:hover:bg-red-900/60"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                    {!isIframeLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center backdrop-blur-xs">
                            <Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400" />
                            <div className="space-y-1 max-w-md">
                                <p className="text-sm font-medium text-foreground">
                                    Compiling &amp; loading preview...
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {statusMessage}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Keep a single persistent terminal mounted across loading -> preview */}
            <div className={previewUrl ? "h-64 border-t border-border" : "h-64 p-4 pt-0"}>
                <TerminalComponent
                    ref={terminalRef}
                    webContainerInstance={instance}
                    theme={activeTheme}
                    className="h-full"
                />
            </div>
        </div>
    );
};

export default WebContainerPreview;
