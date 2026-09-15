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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoadingStep } from "@/modules/playground/components/loader";
import PlaygroundEditor from "@/modules/playground/components/playground-editor";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { findFilePath } from "@/modules/playground/lib";
import {
    TemplateFile,
    TemplateFolder,
    TemplateItem,
} from "@/modules/playground/lib/path-to-json";
import WebContainerPreview from "@/modules/webcontainers/components/WebContainerPreview";
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

import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MainPlaygroundPage = () => {
    const { id } = useParams<{ id: string }>();

    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

    const {
        playgroundData,
        saveTemplateData,
        loadPlayground,
        templateData: loadedTemplateData,
        isLoading,
        error,
    } = usePlayground(id);

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
        // @ts-expect-error todo
    } = useWebContainer({ templateData: explorerTemplateData });

    // console.log("templateData", templateData);
    // console.log("playgroundData", playgroundData);

    const lastSyncedContent = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        setPlaygroundId(id);
    }, [id, setPlaygroundId]);

    // Keep every client-side surface on one live tree. The data from the
    // database is only used to hydrate a playground once, never to overwrite
    // a newly-created file or folder in the current session.
    const hydratedPlaygroundId = useRef<string | null>(null);
    useEffect(() => {
        if (loadedTemplateData && hydratedPlaygroundId.current !== id) {
            hydratedPlaygroundId.current = id;
            setTemplateData(loadedTemplateData);
            setOpenFiles([]);
        }
    }, [id, loadedTemplateData, setOpenFiles, setTemplateData]);

    // Create wrapper functions that pass saveTemplateData
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
        async (fileId?: string) => {
            const targetFileId = fileId || activeFileId;
            if (!targetFileId) return;

            const fileToSave = openFiles.find((f) => f.id === targetFileId);
            if (!fileToSave) return;

            const latestTemplateData = useFileExplorer.getState().templateData;
            if (!latestTemplateData) return;

            try {
                const filePath = findFilePath(fileToSave, latestTemplateData);
                if (!filePath) {
                    toast.error(
                        `Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`,
                    );
                    return;
                }

                // Update file content in template data (clone for immutability)
                const updatedTemplateData = JSON.parse(
                    JSON.stringify(latestTemplateData),
                ) as TemplateFolder;
                const updateFileContent = (items: TemplateItem[]): TemplateItem[] =>
                    items.map((item) => {
                        if ("folderName" in item) {
                            return { ...item, items: updateFileContent(item.items) };
                        } else if (
                            item.filename === fileToSave.filename &&
                            item.fileExtension === fileToSave.fileExtension
                        ) {
                            return { ...item, content: fileToSave.content };
                        }
                        return item;
                    });
                updatedTemplateData.items = updateFileContent(
                    updatedTemplateData.items,
                );

                // Sync with WebContainer
                if (writeFileSync) {
                    await writeFileSync(filePath, fileToSave.content);
                    lastSyncedContent.current.set(fileToSave.id, fileToSave.content);
                    if (instance && instance.fs) {
                        await instance.fs.writeFile(filePath, fileToSave.content);
                    }
                }

                // Use saveTemplateData to persist changes
                await saveTemplateData(updatedTemplateData);
                setTemplateData(updatedTemplateData);
                setPreviewRefreshKey((current) => current + 1);

                // Update open files
                const updatedOpenFiles = openFiles.map((f) =>
                    f.id === targetFileId
                        ? {
                            ...f,
                            content: fileToSave.content,
                            originalContent: fileToSave.content,
                            hasUnsavedChanges: false,
                        }
                        : f,
                );
                setOpenFiles(updatedOpenFiles);

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
        },
        [
            activeFileId,
            openFiles,
            writeFileSync,
            instance,
            saveTemplateData,
            setTemplateData,
            setOpenFiles,
            setPreviewRefreshKey,
        ],
    );

    const handleSaveAll = useCallback(async () => {
        const unsavedFiles = openFiles.filter((f) => f.hasUnsavedChanges);

        if (unsavedFiles.length === 0) {
            toast.info("No unsaved changes");
            return;
        }

        try {
            // Save one at a time so a later request cannot overwrite the
            // template tree written by an earlier one.
            for (const file of unsavedFiles) {
                await handleSave(file.id);
            }
            toast.success(`Saved ${unsavedFiles.length} file(s)`);
        } catch (error) {
            toast.error("Failed to save some files");
        }
    }, [handleSave, openFiles]);

    // Add event to save file by click ctrl + s
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
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

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                    Something went wrong
                </h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="destructive">
                    Try Again
                </Button>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
                <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-6 text-center">
                        Loading Playground
                    </h2>
                    <div className="mb-8">
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
                        <LoadingStep currentStep={3} step={3} label="Ready to code" />
                    </div>
                </div>
            </div>
        );
    }

    // No template data
    if (!explorerTemplateData) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
                <FolderOpen className="h-12 w-12 text-amber-500 mb-4" />
                <h2 className="text-xl font-semibold text-amber-600 mb-2">
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
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
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
                                        <span className="ml-1.5 text-amber-500">
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
                                            rounded-lg
                                            border-blue-500/40
                                            bg-blue-500/[0.08]
                                            px-3
                                            text-blue-500
                                            shadow-[0_2px_10px_rgba(59,130,246,0.10)]
                                            transition-all duration-200

                                            hover:border-blue-400/70
                                            hover:bg-blue-500/[0.15]
                                            hover:text-blue-400
                                            hover:shadow-[0_0_18px_rgba(59,130,246,0.22)]
                                            hover:-translate-y-px

                                            active:translate-y-0
                                            active:scale-[0.97]

                                            disabled:opacity-40
                                            disabled:hover:translate-y-0
                                            disabled:hover:shadow-none
                                        "
                                        >
                                            <Save className="size-4 transition-transform duration-200 group-hover:scale-110" />
                                            <span className="text-xs font-medium">Save</span>

                                            {/* Shine */}
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
                                            rounded-lg
                                            border-violet-500/40
                                            bg-gradient-to-r
                                            from-violet-500/[0.10]
                                            via-indigo-500/[0.08]
                                            to-blue-500/[0.10]
                                            px-3
                                            text-violet-500
                                            shadow-[0_2px_12px_rgba(139,92,246,0.12)]
                                            transition-all duration-200

                                            hover:border-violet-400/70
                                            hover:from-violet-500/[0.18]
                                            hover:via-indigo-500/[0.15]
                                            hover:to-blue-500/[0.18]
                                            hover:text-violet-400
                                            hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]
                                            hover:-translate-y-px

                                            active:translate-y-0
                                            active:scale-[0.97]

                                            disabled:opacity-40
                                            disabled:hover:translate-y-0
                                            disabled:hover:shadow-none
                                        "
                                        >
                                            <Save className="size-4 transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110" />
                                            <span className="text-xs font-medium">All</span>

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
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="
                                        group relative size-9 overflow-hidden
                                        rounded-lg
                                        border-violet-500/40
                                        bg-gradient-to-br
                                        from-violet-500/15
                                        via-indigo-500/10
                                        to-cyan-500/10
                                        text-violet-500
                                        shadow-[0_2px_14px_rgba(139,92,246,0.15)]
                                        transition-all duration-200

                                        hover:border-violet-400/70
                                        hover:text-violet-400
                                        hover:shadow-[0_0_22px_rgba(139,92,246,0.30)]
                                        hover:-translate-y-px

                                        active:translate-y-0
                                        active:scale-[0.94]
                                    "
                                        >
                                            <Bot
                                                className="
                                        relative z-10 size-4
                                        transition-all duration-300
                                        group-hover:scale-110
                                        group-hover:rotate-[-5deg]
                                    "
                                            />

                                            {/* Glow */}
                                            <span
                                                className="
                                                absolute inset-0
                                                bg-gradient-to-r
                                                from-violet-500/0
                                                via-violet-500/15
                                                to-cyan-500/0
                                                opacity-0
                                                transition-opacity duration-300
                                                group-hover:opacity-100
                                            "
                                            />
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent>AI Assistant</TooltipContent>
                                </Tooltip>

                                {/* Settings */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="
                                            size-9
                                            rounded-lg
                                            border-border/60
                                            bg-background/50
                                            text-muted-foreground
                                            shadow-sm
                                            transition-all duration-200

                                            hover:border-indigo-500/40
                                            hover:bg-indigo-500/10
                                            hover:text-indigo-500
                                            hover:shadow-[0_0_14px_rgba(99,102,241,0.15)]
                                            hover:-translate-y-px

                                            active:translate-y-0
                                            active:scale-[0.94]
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
                            <div className="h-full flex flex-col">
                                <div className="border-b bg-muted/30">
                                    <Tabs
                                        value={activeFileId || ""}
                                        onValueChange={setActiveFileId}
                                    >
                                        <div className="flex items-center justify-between px-4 py-2">
                                            <TabsList className="h-8 bg-transparent p-0 gap-1">
                                                {openFiles.map((file) => (
                                                    <TabsTrigger
                                                        key={file.id}
                                                        value={file.id}
                                                        className="
                                                            relative
                                                            h-8
                                                            px-3
                                                            rounded-md
                                                            text-muted-foreground
                                                            transition-all
                                                            duration-200
                                                            ease-out

                                                            hover:bg-muted/70
                                                            hover:text-foreground

                                                            data-[state=active]:
                                                                bg-gradient-to-b
                                                                data-[state=active]:from-blue-500/20
                                                                data-[state=active]:via-blue-500/10
                                                                data-[state=active]:to-blue-500/5

                                                            data-[state=active]:text-blue-500

                                                            data-[state=active]:
                                                                border
                                                                data-[state=active]:border-blue-500/30

                                                            data-[state=active]:
                                                                shadow-[0_3px_10px_rgba(59,130,246,0.20),inset_0_1px_0_rgba(255,255,255,0.12)]

                                                            data-[state=active]:translate-y-[-1px]

                                                            group
                                                        "
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {/* File Icon */}
                                                            <FileText
                                                                className="
                                                                    h-3.5
                                                                    w-3.5
                                                                    text-blue-500
                                                                "
                                                            />

                                                            {/* File Name */}
                                                            <span className="text-sm">
                                                                {file.filename}.{file.fileExtension}
                                                            </span>

                                                            {/* Unsaved Changes */}
                                                            {file.hasUnsavedChanges && (
                                                                <span
                                                                    className="
                                                                        h-1.5
                                                                        w-1.5
                                                                        rounded-full
                                                                        bg-blue-500
                                                                        shadow-[0_0_6px_rgba(59,130,246,0.8)]
                                                                    "
                                                                />
                                                            )}

                                                            {/* Close Button */}
                                                            <span
                                                                className="
                                                                    ml-1
                                                                    h-4
                                                                    w-4
                                                                    rounded-md
                                                                    flex
                                                                    items-center
                                                                    justify-center

                                                                    opacity-0
                                                                    group-hover:opacity-100

                                                                    text-muted-foreground

                                                                    hover:bg-blue-500
                                                                    hover:text-white

                                                                    hover:shadow-[0_0_8px_rgba(59,130,246,0.5)]

                                                                    transition-all
                                                                    duration-150
                                                                    cursor-pointer
                                                                "
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    closeFile(file.id);
                                                                }}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </span>
                                                        </div>
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>

                                            {openFiles.length > 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={closeAllFiles}
                                                    className="
                                                        h-7
                                                        px-3
                                                        rounded-md

                                                        text-xs
                                                        font-medium
                                                        text-blue-500

                                                        bg-blue-500/10

                                                        border
                                                        border-blue-500/20

                                                        shadow-[0_2px_6px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.10)]

                                                        transition-all
                                                        duration-200
                                                        ease-out

                                                        hover:bg-blue-500/20
                                                        hover:border-blue-500/40
                                                        hover:text-blue-400

                                                        hover:shadow-[0_4px_12px_rgba(59,130,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]

                                                        hover:-translate-y-[1px]

                                                        active:translate-y-0
                                                        active:shadow-[0_1px_3px_rgba(59,130,246,0.15)]
                                                            "
                                                >
                                                    Close All
                                                </Button>
                                            )}
                                        </div>
                                    </Tabs>
                                </div>

                                <div className="flex-1">
                                    <ResizablePanelGroup orientation="horizontal">
                                        <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                                            <PlaygroundEditor
                                                activeFile={activeFile}
                                                content={activeFile?.content || ""}
                                                onContentChange={(value) => {
                                                    activeFileId && updateFileContent(activeFileId,value)
                                                }}
                                            />
                                        </ResizablePanel>

                                        {isPreviewVisible && (
                                            <>
                                                <ResizableHandle />
                                                <ResizablePanel defaultSize={50}>
                                                    <WebContainerPreview
                                                        templateData={explorerTemplateData}
                                                        instance={instance}
                                                        writeFileSync={writeFileSync}
                                                        isLoading={containerLoading}
                                                        error={containerError}
                                                        serverUrl={serverUrl!}
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
