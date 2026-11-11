"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import type { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { transformToWebContainerFormat } from "../hooks/transformer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TerminalComponent from "./terminal";
import { WebContainer } from "@webcontainer/api";

interface WebContainerPreviewProps {
    templateData: TemplateFolder;
    serverUrl: string;
    isLoading: boolean;
    error: string | null;
    instance: WebContainer | null;
    writeFileSync: (path: string, content: string) => Promise<void>;
    forceResetup?: boolean; // Optional prop to force re-setup
    refreshKey?: number;
}

const WebContainerPreview: React.FC<WebContainerPreviewProps> = ({
    templateData,
    error,
    instance,
    isLoading,
    serverUrl,
    writeFileSync,
    forceResetup = false,
    refreshKey = 0,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [previewRevision, setPreviewRevision] = useState(0);
    const [loadingState, setLoadingState] = useState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
    });
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 4;
    const [setupError, setSetupError] = useState<string | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [isSetupInProgress, setIsSetupInProgress] = useState(false);

    // Ref to access terminal methods
    const terminalRef = useRef<any>(null);
    const serverProcessRef = useRef<{ kill: () => void } | null>(null);
    const { resolvedTheme } = useTheme();
    const activeTheme: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark";

    // Reset setup state when forceResetup changes
    useEffect(() => {
        if (forceResetup) {
            setIsSetupComplete(false);
            setIsSetupInProgress(false);
            setPreviewUrl("");
            setCurrentStep(0);
            setLoadingState({
                transforming: false,
                mounting: false,
                installing: false,
                starting: false,
                ready: false,
            });
        }
    }, [forceResetup]);

    useEffect(() => {
        async function setupContainer() {
            // Don't run setup if it's already complete or in progress
            if (!instance || isSetupComplete || isSetupInProgress) return;

            try {
                setIsSetupInProgress(true);
                setSetupError(null);

                // Check if server is already running by testing if files are already mounted
                try {
                    const packageJsonExists = await instance.fs.readFile('package.json', 'utf8');
                    if (packageJsonExists) {
                        // Files are already mounted, just reconnect to existing server
                        if (terminalRef.current?.writeToTerminal) {
                            terminalRef.current.writeToTerminal("🔄 Reconnecting to existing WebContainer session...\r\n");
                        }

                        // Check if server is already running
                        instance.on("server-ready", (port: number, url: string) => {
                            console.log(`Reconnected to server on port ${port} at ${url}`);
                            if (terminalRef.current?.writeToTerminal) {
                                terminalRef.current.writeToTerminal(`🌐 Reconnected to server at ${url}\r\n`);
                            }
                            setPreviewUrl(url);
                            setPreviewRevision((revision) => revision + 1);
                            setLoadingState((prev) => ({
                                ...prev,
                                starting: false,
                                ready: true,
                            }));
                            setIsSetupComplete(true);
                            setIsSetupInProgress(false);
                        });

                        setCurrentStep(4);
                        setLoadingState((prev) => ({ ...prev, starting: true }));
                        return;
                    }
                } catch (e) {
                    // Files don't exist, proceed with normal setup
                }

                // Step 1: Transform data
                setLoadingState((prev) => ({ ...prev, transforming: true }));
                setCurrentStep(1);

                // Write to terminal
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("🔄 Transforming template data...\r\n");
                }


                const files = transformToWebContainerFormat(templateData);

                setLoadingState((prev) => ({
                    ...prev,
                    transforming: false,
                    mounting: true,
                }));
                setCurrentStep(2);

                // Step 2: Mount files
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("📁 Mounting files to WebContainer...\r\n");
                }

                await instance.mount(files);

                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("✅ Files mounted successfully\r\n");
                }

                setLoadingState((prev) => ({
                    ...prev,
                    mounting: false,
                    installing: true,
                }));
                setCurrentStep(3);

                // Step 3: Install dependencies
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("📦 Installing dependencies...\r\n");
                }

                const installProcess = await instance.spawn("npm", ["install"]);

                // Stream install output to terminal
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            // Write directly to terminal
                            if (terminalRef.current?.writeToTerminal) {
                                terminalRef.current.writeToTerminal(data);
                            }
                        },
                    })
                );

                const installExitCode = await installProcess.exit;

                if (installExitCode !== 0) {
                    throw new Error(`Failed to install dependencies. Exit code: ${installExitCode}`);
                }

                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("✅ Dependencies installed successfully\r\n");
                }

                setLoadingState((prev) => ({
                    ...prev,
                    installing: false,
                    starting: true,
                }));
                setCurrentStep(4);

                // Step 4: Start the server
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("🚀 Starting development server...\r\n");
                }

                const startProcess = await instance.spawn("npm", ["run", "start"]);
                serverProcessRef.current = startProcess;

                // Listen for server ready event
                instance.on("server-ready", (port: number, url: string) => {
                    console.log(`Server ready on port ${port} at ${url}`);
                    if (terminalRef.current?.writeToTerminal) {
                        terminalRef.current.writeToTerminal(`🌐 Server ready at ${url}\r\n`);
                    }
                    setPreviewUrl(url);
                    setPreviewRevision((revision) => revision + 1);
                    setLoadingState((prev) => ({
                        ...prev,
                        starting: false,
                        ready: true,
                    }));
                    setIsSetupComplete(true);
                    setIsSetupInProgress(false);
                });

                // Handle start process output - stream to terminal
                startProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            if (terminalRef.current?.writeToTerminal) {
                                terminalRef.current.writeToTerminal(data);
                            }
                        },
                    })
                );

            } catch (err) {
                console.error("Error setting up container:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);

                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal(`❌ Error: ${errorMessage}\r\n`);
                }

                setSetupError(errorMessage);
                setIsSetupInProgress(false);
                setLoadingState({
                    transforming: false,
                    mounting: false,
                    installing: false,
                    starting: false,
                    ready: false,
                });
            }
        }

        setupContainer();
    }, [instance, templateData, isSetupComplete, isSetupInProgress]);

    // Most backend starters (such as Hono) do not implement hot module
    // replacement. Restart the process after a saved source change; the
    // existing server-ready listener then refreshes the iframe below.
    useEffect(() => {
        if (!instance || !isSetupComplete || refreshKey === 0) return;
        const webcontainer = instance;

        async function restartServer() {
            try {
                serverProcessRef.current?.kill();
                const process = await webcontainer.spawn("npm", ["run", "start"]);
                serverProcessRef.current = process;

                process.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            terminalRef.current?.writeToTerminal(data);
                        },
                    })
                );
            } catch (restartError) {
                const message = restartError instanceof Error
                    ? restartError.message
                    : "Unable to restart the preview server";
                setSetupError(message);
            }
        }

        restartServer();
    }, [instance, isSetupComplete, refreshKey]);

    // Cleanup function to prevent memory leaks
    useEffect(() => {
        return () => {
            // Don't kill processes or cleanup when component unmounts
            // The WebContainer should persist across component re-mounts
        };
    }, []);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-4 bg-background">
                <div className="text-center space-y-4 max-w-md p-6 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_16px_rgba(15,23,42,0.04)] dark:shadow-none">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <h3 className="text-lg font-medium text-foreground">Initializing WebContainer</h3>
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
            return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
        } else if (stepIndex === currentStep) {
            return <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />;
        } else {
            return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
        }
    };

    const getStepText = (stepIndex: number, label: string) => {
        const isActive = stepIndex === currentStep;
        const isComplete = stepIndex < currentStep;

        return (
            <span className={`text-sm font-medium ${isComplete ? 'text-emerald-700 dark:text-emerald-400' :
                isActive ? 'text-blue-600 dark:text-blue-400' :
                    'text-muted-foreground'
                }`}>
                {label}
            </span>
        );
    };

    return (
        <div className="h-full w-full flex flex-col bg-background">
            {!previewUrl ? (
                <div className="h-full flex flex-col">
                    <div className="w-full max-w-md p-6 m-5 rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_16px_rgba(15,23,42,0.04)] dark:shadow-sm mx-auto">


                        <Progress
                            value={(currentStep / totalSteps) * 100}
                            className="h-2 mb-6"
                        />

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

                    {/* Terminal */}
                    <div className="flex-1 p-4">
                        <TerminalComponent
                            ref={terminalRef}
                            webContainerInstance={instance}
                            theme={activeTheme}
                            className="h-full"
                        />
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col">
                    {/* Preview */}
                    <div className="flex-1 bg-white [color-scheme:only_light]">
                        <iframe
                            src={`${previewUrl}?preview=${previewRevision}`}
                            className="w-full h-full border-none bg-white [color-scheme:only_light]"
                            title="WebContainer Preview"
                        />
                    </div>

                    {/* Terminal at bottom when preview is ready */}
                    <div className="h-64 border-t border-border">
                        <TerminalComponent
                            ref={terminalRef}
                            webContainerInstance={instance}
                            theme={activeTheme}
                            className="h-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebContainerPreview;
