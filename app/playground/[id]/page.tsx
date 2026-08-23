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
import PlaygroundEditor from "@/modules/playground/components/playground-editor";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { TemplateFile } from "@/modules/playground/lib/path-to-json";
import { Bot, FileText, Save, Settings, X } from "lucide-react";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const MainPlaygroundPage = () => {
    const { id } = useParams<{ id: string }>();

    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    const {
        playgroundData,
        saveTemplateData,
        loadPlayground,
        templateData,
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
    } = useFileExplorer();

    // console.log("templateData", templateData);
    // console.log("playgroundData", playgroundData);

    useEffect(() => {
        setPlaygroundId(id);
    }, [id, setPlaygroundId]);

    useEffect(() => {
        if (templateData && !openFiles.length) {
            setTemplateData(templateData);
        }
    }, [templateData, setTemplateData, openFiles.length]);

    const activeFile = openFiles.find((file) => file.id === activeFileId);
    const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

    const handleFileSelect = (file: TemplateFile) => {
        openFile(file);
    };

    return (
        <TooltipProvider>
            <>
                <TemplateFileTree
                    data={templateData!}
                    onFileSelect={handleFileSelect}
                    selectedFile={activeFile}
                    title="File Explorer"
                    onAddFile={() => { }}
                    onAddFolder={() => { }}
                    onDeleteFile={() => { }}
                    onDeleteFolder={() => { }}
                    onRenameFile={() => { }}
                    onRenameFolder={() => { }}
                />

                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />

                        <div className="flex flex-1 items-center gap-2">
                            <div className="flex flex-col flex-1">
                                <h1 className="text-sm font-medium">
                                    {playgroundData?.title || "Code PlayGround"}
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    {openFiles.length} File(s) Open
                                    {hasUnsavedChanges && "* Unsaved changes "}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => { }}
                                            disabled={!activeFile || !activeFile.hasUnsavedChanges}
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Save (Ctrl+S)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => { }}
                                            disabled={!hasUnsavedChanges}
                                        >
                                            <Save className="h-4 w-4" />
                                            All
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Save All (Ctrl+Shift+S)</TooltipContent>
                                </Tooltip>

                                <Button variant={"default"} size={"icon"}>
                                    <Bot className="size-4" />
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Settings className="h-4 w-4" />
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
                                        <ResizablePanel defaultSize = {isPreviewVisible ? 50 : 100}>
                                            
                                            <PlaygroundEditor
                                            activeFile={activeFile}
                                            content={activeFile?.content || ""}
                                            onContentChange= {()=>{}}
                                            />
                                        </ResizablePanel>
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
