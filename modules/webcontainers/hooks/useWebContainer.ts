import { useState, useEffect, useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";

interface UseWebContainerProps {
    templateData: TemplateFolder | null;
}

interface UseWebContainerReturn {
    serverUrl: string | null;
    isLoading: boolean;
    error: string | null;
    instance: WebContainer | null;
    writeFileSync: (path: string, content: string) => Promise<void>;
    destroy: () => void;
}

// WebContainer allows only a single active instance per browser tab.
// Serialize teardown -> boot transitions across client-side route changes.
let activeInstance: WebContainer | null = null;
let lifecycleQueue: Promise<void> = Promise.resolve();

export const useWebContainer = ({
    templateData,
}: UseWebContainerProps): UseWebContainerReturn => {
    void templateData;
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [instance, setInstance] = useState<WebContainer | null>(null);
    const instanceRef = useRef<WebContainer | null>(null);

    useEffect(() => {
        let mounted = true;
        let localInstance: WebContainer | null = null;
        let unsubscribeServerReady: (() => void) | null = null;

        const bootTask = lifecycleQueue.then(async () => {
            if (!mounted) return;

            try {
                if (typeof window !== "undefined") {
                    const reloadKey = `coi-reload:${window.location.pathname}`;
                    if (!window.crossOriginIsolated) {
                        if (!sessionStorage.getItem(reloadKey)) {
                            sessionStorage.setItem(reloadKey, "1");
                            window.location.reload();
                            return;
                        }
                        throw new Error(
                            "Cross-Origin Isolation is required for WebContainer. Please reload the page."
                        );
                    }
                    sessionStorage.removeItem(reloadKey);
                }

                if (activeInstance) {
                    activeInstance.teardown();
                    activeInstance = null;
                }

                const webcontainerInstance = await WebContainer.boot({
                    coep: "require-corp",
                    forwardPreviewErrors: true,
                });

                if (!mounted) {
                    webcontainerInstance.teardown();
                    return;
                }

                localInstance = webcontainerInstance;
                activeInstance = webcontainerInstance;
                instanceRef.current = webcontainerInstance;

                unsubscribeServerReady = webcontainerInstance.on(
                    "server-ready",
                    (_port: number, url: string) => {
                        if (mounted) {
                            setServerUrl(url);
                        }
                    }
                );

                setInstance(webcontainerInstance);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to initialize WebContainer:", err);
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to initialize WebContainer"
                    );
                    setIsLoading(false);
                }
            }
        });

        lifecycleQueue = bootTask.catch(() => undefined);

        return () => {
            mounted = false;
            if (unsubscribeServerReady) {
                unsubscribeServerReady();
                unsubscribeServerReady = null;
            }

            const teardownTask = lifecycleQueue.then(() => {
                const target = localInstance ?? instanceRef.current;
                if (target) {
                    target.teardown();
                    if (activeInstance === target) {
                        activeInstance = null;
                    }
                    if (instanceRef.current === target) {
                        instanceRef.current = null;
                    }
                }
            });

            lifecycleQueue = teardownTask.catch(() => undefined);
        };
    }, []);

    const writeFileSync = useCallback(
        async (path: string, content: string) => {
            const target = instanceRef.current ?? instance;
            if (!target) {
                throw new Error("WebContainer instance is not available");
            }

            try {
                const normalizedPath = path.replace(/^\/+/, "");
                const pathParts = normalizedPath.split("/");
                const folderPath = pathParts.slice(0, -1).join("/");

                if (folderPath) {
                    await target.fs.mkdir(folderPath, { recursive: true });
                }
                await target.fs.writeFile(normalizedPath, content);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to write file";
                console.error(`Failed to write file at ${path}:`, err);
                throw new Error(`Failed to write file at ${path}: ${errorMessage}`);
            }
        },
        [instance]
    );

    const destroy = useCallback(() => {
        const target = instanceRef.current ?? instance;
        if (target) {
            target.teardown();
            if (activeInstance === target) {
                activeInstance = null;
            }
            instanceRef.current = null;
            setInstance(null);
            setServerUrl(null);
        }
    }, [instance]);

    return { serverUrl, isLoading, error, destroy, writeFileSync, instance };
};
