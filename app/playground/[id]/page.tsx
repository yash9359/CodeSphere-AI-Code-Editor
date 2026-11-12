"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import dynamic from "next/dynamic";
import { LoadingStep } from "@/modules/playground/components/loader";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import ToggleAI from "@/modules/playground/components/toggle-ai";
import { UseAISuggestions } from "@/modules/playground/hooks/useAISuggestion";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { findFilePath } from "@/modules/playground/lib";
import {
    TemplateFile,
    TemplateFolder,
    TemplateItem,
} from "@/modules/playground/lib/path-to-json";
import { useWebContainer } from "@/modules/webcontainers/hooks/useWebContainer";

import {
    AlertCircle,
    Bot,
    FileText,
    FolderOpen,
    Save,
    Settings,
    X,
} from "lucide-react";

import { FileIcon } from "@react-symbols/icons/utils";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const PlaygroundEditor = dynamic(
    () => import("@/modules/playground/components/playground-editor"),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full w-full items-center justify-center bg-background text-xs text-muted-foreground">
                Loading editor...
            </div>
        ),
    }
);

const WebContainerPreview = dynamic(
    () => import("@/modules/webcontainers/components/WebContainerPreview"),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full w-full items-center justify-center bg-background text-xs text-muted-foreground">
                Loading terminal & preview...
            </div>
        ),
    }
);

function updateFileInTreeByPath(
    folder: TemplateFolder,
    pathSegments: string[],
    nextContent: string,
): boolean {
    if (pathSegments.length === 0) return false;

    const [head, ...rest] = pathSegments;

    for (let i = 0; i < folder.items.length; i++) {
        const item = folder.items[i];

        if ("folderName" in item) {
            if (rest.length > 0 && item.folderName === head) {
                return updateFileInTreeByPath(item, rest, nextContent);
            }
        } else if (rest.length === 0) {
            const fullName = item.filename + (item.fileExtension ? `.${item.fileExtension}` : "");

            if (fullName === head) {
                folder.items[i] = { ...item, content: nextContent };
                return true;
            }
        }
    }

    return false;
}

const MainPlaygroundPage = () => {
    const { id } = useParams<{ id: string }>();

    const [isPreviewVisible, setIsPreviewVisible] = useState(true);
    const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

    const {
        playgroundData,
        saveTemplateData,
        loadPlayground,
        templateData: loadedTemplateData,
        isLoading,
        error,
    } = usePlayground(id);

    const aiSuggestions = UseAISuggestions();

    const {
        activeFileId,
        closeFile,
        closeAllFiles,
        openFile,
        openFiles,
        setTemplateData,
        setActiveFileId,
        setPlaygroundId,
        setOpenFiles,
        editorContent,
        handleAddFile,
        handleAddFolder,
        handleDeleteFile,
        handleDeleteFolder,
        handleRenameFile,
        handleRenameFolder,
        playgroundId,
        setEditorContent,
        updateFileContent,
        templateData: explorerTemplateData,
    } = useFileExplorer();

    const {
        serverUrl,
        destroy,
        error: containerError,
        instance,
        isLoading: containerLoading,
        writeFileSync,
    } = useWebContainer({ templateData: explorerTemplateData });

    const lastSyncedContent = useRef<Map<string, string>>(new Map());
    const editorContentGetterRef = useRef<((fileId?: string) => string | undefined) | null>(null);
    const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

    const openFileIds = useMemo(
        () => openFiles.map((file) => file.id),
        [openFiles]
    );

    const handleEditorContentChange = useCallback(
        (value: string, fileId?: string) => {
            const targetId = fileId || useFileExplorer.getState().activeFileId;

            if (targetId) {
                updateFileContent(targetId, value);
            }
        },
        [updateFileContent],
    );

    useEffect(() => {
        setPlaygroundId(id);
    }, [id, setPlaygroundId]);

    // Keep every client-side surface on one live tree.
    const hydratedPlaygroundId = useRef<string | null>(null);

    useEffect(() => {
        if (loadedTemplateData && hydratedPlaygroundId.current !== id) {
            hydratedPlaygroundId.current = id;
            setTemplateData(loadedTemplateData);
            setOpenFiles([]);
        }
    }, [id, loadedTemplateData, setOpenFiles, setTemplateData]);

    // Create wrapper functions that pass saveTemplateData.
    const wrappedHandleAddFile = useCallback(
        (newFile: TemplateFile, parentPath: string) => {
            return handleAddFile(
                newFile,
                parentPath,
                writeFileSync!,
                instance,
                saveTemplateData,
            );
        },
        [handleAddFile, writeFileSync, instance, saveTemplateData],
    );

    const wrappedHandleAddFolder = useCallback(
        (newFolder: TemplateFolder, parentPath: string) => {
            return handleAddFolder(newFolder, parentPath, instance, saveTemplateData);
        },
        [handleAddFolder, instance, saveTemplateData],
    );

    const wrappedHandleDeleteFile = useCallback(
        (file: TemplateFile, parentPath: string) => {
            return handleDeleteFile(file, parentPath, saveTemplateData);
        },
        [handleDeleteFile, saveTemplateData],
    );

    const wrappedHandleDeleteFolder = useCallback(
        (folder: TemplateFolder, parentPath: string) => {
            return handleDeleteFolder(folder, parentPath, saveTemplateData);
        },
        [handleDeleteFolder, saveTemplateData],
    );

    const wrappedHandleRenameFile = useCallback(
        (
            file: TemplateFile,
            newFilename: string,
            newExtension: string,
            parentPath: string,
        ) => {
            return handleRenameFile(
                file,
                newFilename,
                newExtension,
                parentPath,
                saveTemplateData,
            );
        },
        [handleRenameFile, saveTemplateData],
    );

    const wrappedHandleRenameFolder = useCallback(
        (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
            return handleRenameFolder(
                folder,
                newFolderName,
                parentPath,
                saveTemplateData,
            );
        },
        [handleRenameFolder, saveTemplateData],
    );

    const activeFile = openFiles.find((file) => file.id === activeFileId);
    const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

    const handleFileSelect = (file: TemplateFile) => {
        openFile(file);
    };

    const handleSave = useCallback(
        (fileId?: string) => {
            const runSave = async () => {
                const storeState = useFileExplorer.getState();
                const targetFileId = fileId || storeState.activeFileId;

                if (!targetFileId) return;

                const fileToSave = storeState.openFiles.find((f) => f.id === targetFileId);
                if (!fileToSave) return;

                const latestTemplateData = storeState.templateData;
                if (!latestTemplateData) return;

                const liveContent = editorContentGetterRef.current?.(targetFileId);
                const contentToSave = liveContent !== undefined ? liveContent : fileToSave.content;

                if (liveContent !== undefined && liveContent !== fileToSave.content) {
                    storeState.updateFileContent(targetFileId, contentToSave);
                }

                try {
                    const filePath =
                        fileToSave.filePath || findFilePath(fileToSave, latestTemplateData);

                    if (!filePath) {
                        toast.error(
                            `Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`,
                        );
                        return;
                    }

                    // Update only the target file in template data.
                    const updatedTemplateData = JSON.parse(
                        JSON.stringify(latestTemplateData),
                    ) as TemplateFolder;

                    const normalizedPath = filePath.replace(/^\/+/, "");

                    const updatedExact = updateFileInTreeByPath(
                        updatedTemplateData,
                        normalizedPath.split("/"),
                        contentToSave,
                    );

                    if (!updatedExact) {
                        const fallbackUpdate = (items: TemplateItem[]): TemplateItem[] =>
                            items.map((item) => {
                                if ("folderName" in item) {
                                    return { ...item, items: fallbackUpdate(item.items) };
                                } else if (
                                    item.filename === fileToSave.filename &&
                                    item.fileExtension === fileToSave.fileExtension
                                ) {
                                    return { ...item, content: contentToSave };
                                }

                                return item;
                            });

                        updatedTemplateData.items = fallbackUpdate(updatedTemplateData.items);
                    }

                    // Sync with WebContainer.
                    if (writeFileSync) {
                        await writeFileSync(normalizedPath, contentToSave);
                        lastSyncedContent.current.set(fileToSave.id, contentToSave);
                    }

                    // Persist changes to database.
                    await saveTemplateData(updatedTemplateData);
                    setTemplateData(updatedTemplateData);
                    setPreviewRefreshKey((current) => current + 1);

                    // Mark saved without clobbering newer edits.
                    useFileExplorer.setState((current) => ({
                        openFiles: current.openFiles.map((f) =>
                            f.id === targetFileId
                                ? {
                                    ...f,
                                    filePath: normalizedPath,
                                    originalContent: contentToSave,
                                    hasUnsavedChanges: f.content !== contentToSave,
                                }
                                : f,
                        ),
                    }));

                    toast.success(
                        `Saved ${fileToSave.filename}.${fileToSave.fileExtension}`,
                    );
                } catch (error) {
                    console.error("Error saving file:", error);
                    toast.error(
                        `Failed to save ${fileToSave.filename}.${fileToSave.fileExtension}`,
                    );
                    throw error;
                }
            };

            const nextSave = saveQueueRef.current.then(runSave, runSave);
            saveQueueRef.current = nextSave.catch(() => undefined);

            return nextSave;
        },
        [writeFileSync, saveTemplateData, setTemplateData],
    );

    const handleSaveAll = useCallback(async () => {
        const unsavedFiles = useFileExplorer
            .getState()
            .openFiles.filter((f) => f.hasUnsavedChanges);

        if (unsavedFiles.length === 0) {
            toast.info("No unsaved changes");
            return;
        }

        try {
            for (const file of unsavedFiles) {
                await handleSave(file.id);
            }

            toast.success(`Saved ${unsavedFiles.length} file(s)`);
        } catch (error) {
            toast.error("Failed to save some files");
        }
    }, [handleSave]);

    // Save file with Ctrl + S.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();

                if (e.repeat) return;

                if (e.shiftKey) {
                    handleSaveAll();
                } else {
                    handleSave();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave, handleSaveAll]);

    // Error state.
    if (error) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center w-full min-h-screen p-4">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />

                <h2 className="text-xl font-semibold text-destructive mb-2">
                    Something went wrong
                </h2>

                <p className="text-muted-foreground mb-4">{error}</p>

                <Button onClick={() => window.location.reload()} variant="destructive">
                    Try Again
                </Button>
            </div>
        );
    }

    // Loading state.
    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center w-full min-h-screen p-4">
                <div className="w-full max-w-md p-6 rounded-xl bg-card border border-border shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 text-center text-foreground">
                        Loading Playground
                    </h2>

                    <div className="mb-2 space-y-1">
                        <LoadingStep
                            currentStep={1}
                            step={1}
                            label="Loading playground data"
                        />

                        <LoadingStep
                            currentStep={2}
                            step={2}
                            label="Setting up environment"
                        />

                        <LoadingStep
                            currentStep={3}
                            step={3}
                            label="Ready to code"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // No template data.
    if (!explorerTemplateData) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center w-full min-h-screen p-4">
                <FolderOpen className="h-12 w-12 text-amber-500 mb-4" />

                <h2 className="text-xl font-semibold text-amber-700 dark:text-amber-400 mb-2">
                    No template data available
                </h2>

                <Button onClick={() => window.location.reload()} variant="outline">
                    Reload Template
                </Button>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <>
                <TemplateFileTree
                    data={explorerTemplateData}
                    onFileSelect={handleFileSelect}
                    selectedFile={activeFile}
                    title="File Explorer"
                    onAddFile={wrappedHandleAddFile}
                    onAddFolder={wrappedHandleAddFolder}
                    onDeleteFile={wrappedHandleDeleteFile}
                    onDeleteFolder={wrappedHandleDeleteFolder}
                    onRenameFile={wrappedHandleRenameFile}
                    onRenameFolder={wrappedHandleRenameFolder}
                />

                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/80 bg-card/85 dark:bg-background/80 px-4 backdrop-blur-md">
                        <SidebarTrigger className="-ml-1" />

                        <Separator orientation="vertical" className="mr-2 h-4" />

                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {/* Playground Info */}
                            <div className="flex min-w-0 flex-1 flex-col">
                                <h1 className="truncate text-sm font-semibold tracking-tight">
                                    {playgroundData?.title || "Code PlayGround"}
                                </h1>

                                <p className="text-xs text-muted-foreground">
                                    {openFiles.length} File(s) Open

                                    {hasUnsavedChanges && (
                                        <span className="ml-1.5 font-medium text-amber-600 dark:text-amber-400">
                                            • Unsaved changes
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {/* Save */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSave()}
                                            disabled={!activeFile || !activeFile.hasUnsavedChanges}
                                            className="
                                                group relative h-9 gap-1.5 overflow-hidden
                                                rounded-lg border-blue-200 dark:border-blue-500/40
                                                bg-blue-50/90 dark:bg-blue-500/[0.08]
                                                px-3 text-blue-700 dark:text-blue-400
                                                shadow-[0_2px_10px_rgba(37,99,235,0.08)]
                                                transition-all duration-200
                                                hover:border-blue-400 dark:hover:border-blue-400/70
                                                hover:bg-blue-100/90 dark:hover:bg-blue-500/[0.15]
                                                hover:text-blue-800 dark:hover:text-blue-300
                                                hover:shadow-[0_4px_16px_rgba(37,99,235,0.18)]
                                                hover:-translate-y-px
                                                active:translate-y-0 active:scale-[0.97]
                                                disabled:opacity-40
                                            "
                                        >
                                            <Save className="size-4 transition-transform duration-200 group-hover:scale-110" />

                                            <span className="text-xs font-medium">
                                                Save
                                            </span>

                                            <span
                                                className="
                                                    pointer-events-none absolute inset-0
                                                    -translate-x-full
                                                    bg-gradient-to-r
                                                    from-transparent via-white/10 to-transparent
                                                    transition-transform duration-500
                                                    group-hover:translate-x-full
                                                "
                                            />
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent>
                                        Save <kbd className="ml-1">Ctrl+S</kbd>
                                    </TooltipContent>
                                </Tooltip>

                                {/* Save All */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleSaveAll}
                                            disabled={!hasUnsavedChanges}
                                            className="
                                                group relative h-9 gap-1.5 overflow-hidden
                                                rounded-lg border-violet-200 dark:border-violet-500/40
                                                bg-gradient-to-r
                                                from-violet-50 via-indigo-50 to-blue-50
                                                dark:from-violet-500/[0.10]
                                                dark:via-indigo-500/[0.08]
                                                dark:to-blue-500/[0.10]
                                                px-3 text-violet-700 dark:text-violet-400
                                                shadow-[0_2px_10px_rgba(124,58,237,0.08)]
                                                transition-all duration-200
                                                hover:border-violet-400 dark:hover:border-violet-400/70
                                                hover:from-violet-100 hover:via-indigo-100 hover:to-blue-100
                                                dark:hover:from-violet-500/[0.18]
                                                dark:hover:via-indigo-500/[0.15]
                                                dark:hover:to-blue-500/[0.18]
                                                hover:text-violet-800 dark:hover:text-violet-300
                                                hover:shadow-[0_4px_16px_rgba(124,58,237,0.18)]
                                                hover:-translate-y-px
                                                active:translate-y-0 active:scale-[0.97]
                                                disabled:opacity-40
                                            "
                                        >
                                            <Save className="size-4 transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110" />

                                            <span className="text-xs font-medium">
                                                All
                                            </span>

                                            <span
                                                className="
                                                    pointer-events-none absolute inset-0
                                                    -translate-x-full
                                                    bg-gradient-to-r
                                                    from-transparent via-white/10 to-transparent
                                                    transition-transform duration-500
                                                    group-hover:translate-x-full
                                                "
                                            />
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent>
                                        Save All <kbd className="ml-1">Ctrl+Shift+S</kbd>
                                    </TooltipContent>
                                </Tooltip>

                                {/* AI */}
                                <ToggleAI
                                    isEnabled={aiSuggestions.isEnabled}
                                    onToggle={aiSuggestions.toggleEnabled}
                                    suggestionLoading={aiSuggestions.isLoading}
                                />

                                <ThemeToggle className="size-9 rounded-lg border-border bg-card/80 dark:border-white/10 dark:bg-white/5" />

                                {/* Settings */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="
                                                size-9 rounded-lg
                                                border-border/80 dark:border-border/60
                                                bg-card/80 dark:bg-background/50
                                                text-muted-foreground shadow-sm
                                                transition-all duration-200
                                                hover:border-indigo-500/40
                                                hover:bg-indigo-500/10
                                                hover:text-indigo-600 dark:hover:text-indigo-400
                                                hover:shadow-[0_0_14px_rgba(99,102,241,0.15)]
                                                hover:-translate-y-px
                                                active:translate-y-0 active:scale-[0.94]
                                            "
                                        >
                                            <Settings
                                                className="
                                                    size-4
                                                    transition-transform duration-300
                                                    group-hover:rotate-90
                                                "
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                                        >
                                            {isPreviewVisible ? "Hide" : "Show"} Preview
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem onClick={closeAllFiles}>
                                            Close All Files
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    <div className="h-[calc(100vh-4rem)]">
                        {openFiles.length > 0 ? (
                            <div className="flex h-full flex-col">

                                {/* Professional IDE File Tabs */}
                                <div className="flex h-12 min-w-0 items-center gap-2 border-b border-border bg-[#0d1117] px-3">
                                    <Tabs
                                        value={activeFileId || ""}
                                        onValueChange={setActiveFileId}
                                        className="min-w-0 flex-1 overflow-hidden"
                                    >
                                        <TabsList
                                            className="
                                                flex h-12 w-full min-w-0 flex-nowrap
                                                justify-start gap-1 overflow-x-auto
                                                overflow-y-hidden rounded-none
                                                bg-transparent p-0
                                                [scrollbar-width:none]
                                                [&::-webkit-scrollbar]:hidden
                                            "
                                        >
                                            {openFiles.map((file) => {
                                                const fileName = file.fileExtension
                                                    ? `${file.filename}.${file.fileExtension}`
                                                    : file.filename;

                                                const isActive = activeFileId === file.id;

                                                return (
                                                    <div
                                                        key={file.id}
                                                        className="group relative flex h-12 shrink-0 items-center"
                                                    >
                                                        <TabsTrigger
                                                            value={file.id}
                                                            className={`
                                                                relative flex h-10 shrink-0
                                                                items-center gap-2 rounded-md
                                                                border px-3 pr-9 text-sm
                                                                transition-all duration-150
                                                                ${isActive
                                                                    ? "border-[#303d50] bg-[#17202d] text-[#dbeafe] shadow-sm"
                                                                    : "border-transparent bg-transparent text-[#929ba8] hover:bg-[#171d27] hover:text-[#e2e8f0]"
                                                                }
                                                                data-[state=active]:border-[#303d50]
                                                                data-[state=active]:bg-[#17202d]
                                                                data-[state=active]:text-[#dbeafe]
                                                                data-[state=active]:shadow-sm
                                                                focus-visible:ring-1
                                                                focus-visible:ring-blue-500
                                                            `}
                                                        >
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                                                                <FileIcon
                                                                    fileName={fileName}
                                                                    autoAssign
                                                                    width={16}
                                                                    height={16}
                                                                />
                                                            </span>

                                                            <span className="max-w-[160px] truncate font-medium">
                                                                {fileName}
                                                            </span>

                                                            {file.hasUnsavedChanges && (
                                                                <span
                                                                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"
                                                                    title="Unsaved changes"
                                                                />
                                                            )}
                                                        </TabsTrigger>

                                                        <button
                                                            type="button"
                                                            title={`Close ${fileName}`}
                                                            aria-label={`Close ${fileName}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                closeFile(file.id);
                                                            }}
                                                            className={`
                                                                absolute right-1.5 z-10
                                                                flex h-5 w-5 items-center
                                                                justify-center rounded
                                                                transition-all duration-150
                                                                ${isActive
                                                                    ? "text-slate-300 opacity-100 hover:bg-red-500/20 hover:text-red-400"
                                                                    : "text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                                                                }
                                                            `}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>

                                                        {isActive && (
                                                            <span
                                                                className="
                                                                    pointer-events-none absolute
                                                                    bottom-0 left-3 right-3
                                                                    h-[2px] rounded-full
                                                                    bg-blue-500
                                                                    shadow-[0_0_8px_rgba(59,130,246,0.5)]
                                                                "
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </TabsList>
                                    </Tabs>

                                    {openFiles.length > 1 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={closeAllFiles}
                                            className="
                                                h-8 shrink-0 rounded-md px-3
                                                text-xs font-medium text-slate-400
                                                hover:bg-red-500/10 hover:text-red-400
                                            "
                                        >
                                            Close All
                                        </Button>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <ResizablePanelGroup orientation="horizontal">
                                        <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                                            <PlaygroundEditor
                                                playgroundId={id}
                                                activeFile={activeFile}
                                                openFileIds={openFileIds}
                                                content={activeFile?.content || ""}
                                                onContentChange={handleEditorContentChange}
                                                editorContentGetterRef={editorContentGetterRef}
                                                suggestion={aiSuggestions.suggestion}
                                                suggestionLoading={aiSuggestions.isLoading}
                                                suggestionPosition={aiSuggestions.position}
                                                onAcceptSuggestion={(editor, monaco) =>
                                                    aiSuggestions.acceptSuggestion(editor, monaco)
                                                }
                                                onRejectSuggestion={(editor) =>
                                                    aiSuggestions.rejectSuggestion(editor)
                                                }
                                                onTriggerSuggestion={(type, editor) =>
                                                    aiSuggestions.fetchSuggestion(type, editor)
                                                }
                                            />
                                        </ResizablePanel>

                                        {isPreviewVisible && (
                                            <>
                                                <ResizableHandle />

                                                <ResizablePanel defaultSize={50}>
                                                    <WebContainerPreview
                                                        playgroundId={id}
                                                        templateData={explorerTemplateData}
                                                        instance={instance}
                                                        writeFileSync={writeFileSync}
                                                        isLoading={containerLoading}
                                                        error={containerError}
                                                        serverUrl={serverUrl}
                                                        forceResetup={false}
                                                        refreshKey={previewRefreshKey}
                                                    />
                                                </ResizablePanel>
                                            </>
                                        )}
                                    </ResizablePanelGroup>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                                    <FileText className="h-10 w-10 text-primary" />
                                </div>

                                <h2 className="text-xl font-semibold text-foreground">
                                    No file is open
                                </h2>

                                <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                                    Select a file from the sidebar to start editing your code.
                                </p>
                            </div>
                        )}
                    </div>
                </SidebarInset>
            </>
        </TooltipProvider>
    );
};

export default MainPlaygroundPage;