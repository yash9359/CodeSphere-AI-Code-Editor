
"use client";

import * as React from "react";
import {
    ChevronRight,
    File,
    FileText,
    Folder,
    FolderOpen,
    FilePlus,
    FolderPlus,
    MoreHorizontal,
    Trash2,
    Edit3,
} from "lucide-react";

import { FileIcon } from "@react-symbols/icons/utils";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarRail,
} from "@/components/ui/sidebar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import RenameFolderDialog from "./dialogs/renname-folder-dialog";
import NewFolderDialog from "./dialogs/new-folder-dialog";
import NewFileDialog from "./dialogs/new-file-dialog";
import RenameFileDialog from "./dialogs/rename-file-dialog";
import { DeleteDialog } from "./dialogs/delete-dialog";
import { TemplateFile, TemplateFolder } from "../lib/path-to-json";

type TemplateItem = TemplateFile | TemplateFolder;

interface TemplateFileTreeProps {
    data: TemplateItem;
    onFileSelect?: (file: TemplateFile) => void;
    selectedFile?: TemplateFile;
    title?: string;
    onAddFile?: (file: TemplateFile, parentPath: string) => void;
    onAddFolder?: (folder: TemplateFolder, parentPath: string) => void;
    onDeleteFile?: (file: TemplateFile, parentPath: string) => void;
    onDeleteFolder?: (folder: TemplateFolder, parentPath: string) => void;
    onRenameFile?: (
        file: TemplateFile,
        newFilename: string,
        newExtension: string,
        parentPath: string
    ) => void;
    onRenameFolder?: (
        folder: TemplateFolder,
        newFolderName: string,
        parentPath: string
    ) => void;
}

// Automatic file icons based on filename and extension
function getFileIcon(filename: string, extension: string) {
    const fullFileName = extension
        ? `${filename}.${extension}`
        : filename;

    return (
        <FileIcon
            fileName={fullFileName}
            autoAssign
            className="h-4 w-4 shrink-0"
        />
    );
}

// Folders first, then files alphabetically
function sortItems(items: TemplateItem[]): TemplateItem[] {
    return [...items].sort((a, b) => {
        const aIsFolder = "folderName" in a;
        const bIsFolder = "folderName" in b;

        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;

        const aName = aIsFolder
            ? a.folderName
            : `${a.filename}.${a.fileExtension}`;

        const bName = bIsFolder
            ? b.folderName
            : `${b.filename}.${b.fileExtension}`;

        return aName.localeCompare(bName);
    });
}

export function TemplateFileTree({
    data,
    onFileSelect,
    selectedFile,
    title = "Explorer",
    onAddFile,
    onAddFolder,
    onDeleteFile,
    onDeleteFolder,
    onRenameFile,
    onRenameFolder,
}: TemplateFileTreeProps) {
    const isRootFolder =
        data && typeof data === "object" && "folderName" in data;

    const [isNewFileDialogOpen, setIsNewFileDialogOpen] =
        React.useState(false);

    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] =
        React.useState(false);

    const handleCreateFile = (filename: string, extension: string) => {
        if (onAddFile && isRootFolder) {
            onAddFile(
                {
                    filename,
                    fileExtension: extension,
                    content: "",
                },
                ""
            );
        }

        setIsNewFileDialogOpen(false);
    };

    const handleCreateFolder = (folderName: string) => {
        if (onAddFolder && isRootFolder) {
            onAddFolder(
                {
                    folderName,
                    items: [],
                },
                ""
            );
        }

        setIsNewFolderDialogOpen(false);
    };

    const rootItems = isRootFolder
        ? sortItems((data as TemplateFolder).items)
        : [data];

    return (
        <Sidebar className="border-r border-border/50 bg-background/95 select-none">
            <SidebarContent className="gap-0">
                <SidebarGroup className="p-0">

                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                            {title}
                        </span>

                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsNewFileDialogOpen(true)}
                                className="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                title="New File"
                            >
                                <FilePlus className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsNewFolderDialogOpen(true)}
                                className="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                title="New Folder"
                            >
                                <FolderPlus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <SidebarGroupContent className="p-1.5">
                        <SidebarMenu className="gap-0.5">
                            {rootItems.map((child, index) => {
                                const key =
                                    child && "folderName" in child
                                        ? `folder-${child.folderName}-${index}`
                                        : child
                                            ? `file-${child.filename}.${child.fileExtension}-${index}`
                                            : index;

                                return (
                                    <TemplateNode
                                        key={key}
                                        item={child}
                                        onFileSelect={onFileSelect}
                                        selectedFile={selectedFile}
                                        level={0}
                                        path=""
                                        onAddFile={onAddFile}
                                        onAddFolder={onAddFolder}
                                        onDeleteFile={onDeleteFile}
                                        onDeleteFolder={onDeleteFolder}
                                        onRenameFile={onRenameFile}
                                        onRenameFolder={onRenameFolder}
                                    />
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />

            <NewFileDialog
                isOpen={isNewFileDialogOpen}
                onClose={() => setIsNewFileDialogOpen(false)}
                onCreateFile={handleCreateFile}
            />

            <NewFolderDialog
                isOpen={isNewFolderDialogOpen}
                onClose={() => setIsNewFolderDialogOpen(false)}
                onCreateFolder={handleCreateFolder}
            />
        </Sidebar>
    );
}

interface TemplateNodeProps {
    item: TemplateItem;
    onFileSelect?: (file: TemplateFile) => void;
    selectedFile?: TemplateFile;
    level: number;
    path?: string;
    onAddFile?: (file: TemplateFile, parentPath: string) => void;
    onAddFolder?: (folder: TemplateFolder, parentPath: string) => void;
    onDeleteFile?: (file: TemplateFile, parentPath: string) => void;
    onDeleteFolder?: (folder: TemplateFolder, parentPath: string) => void;
    onRenameFile?: (
        file: TemplateFile,
        newFilename: string,
        newExtension: string,
        parentPath: string
    ) => void;
    onRenameFolder?: (
        folder: TemplateFolder,
        newFolderName: string,
        parentPath: string
    ) => void;
}

function TemplateNode({
    item,
    onFileSelect,
    selectedFile,
    level,
    path = "",
    onAddFile,
    onAddFolder,
    onDeleteFile,
    onDeleteFolder,
    onRenameFile,
    onRenameFolder,
}: TemplateNodeProps) {
    const isValidItem = item && typeof item === "object";
    const isFolder = isValidItem && "folderName" in item;

    const [isNewFileDialogOpen, setIsNewFileDialogOpen] =
        React.useState(false);

    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] =
        React.useState(false);

    const [isRenameDialogOpen, setIsRenameDialogOpen] =
        React.useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
        React.useState(false);

    const [isOpen, setIsOpen] = React.useState(level < 2);

    if (!isValidItem) return null;

    // FILE NODE
    if (!isFolder) {
        const file = item as TemplateFile;

        const fileName = file.fileExtension
            ? `${file.filename}.${file.fileExtension}`
            : file.filename;

        const isSelected =
            selectedFile &&
            selectedFile.filename === file.filename &&
            selectedFile.fileExtension === file.fileExtension;

        const confirmDelete = () => {
            onDeleteFile?.(file, path);
            setIsDeleteDialogOpen(false);
        };

        const handleRenameSubmit = (
            newFilename: string,
            newExtension: string
        ) => {
            onRenameFile?.(
                file,
                newFilename,
                newExtension,
                path
            );

            setIsRenameDialogOpen(false);
        };

        return (
            <SidebarMenuItem>
                <div
                    className={cn(
                        "group/row relative flex items-center h-7 rounded-md px-1.5 text-[13px] transition-colors",
                        isSelected
                            ? "bg-accent text-accent-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-primary before:rounded-full"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                >
                    <SidebarMenuButton
                        isActive={isSelected}
                        onClick={() => onFileSelect?.(file)}
                        className="h-full flex-1 bg-transparent hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent p-0 pl-4 gap-2 overflow-hidden"
                    >
                        {getFileIcon(file.filename, file.fileExtension)}
                        <span className="truncate leading-none">
                            {fileName}
                        </span>
                    </SidebarMenuButton>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 rounded-sm opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 hover:bg-muted transition-opacity"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                                onClick={() => setIsRenameDialogOpen(true)}
                                className="text-xs gap-2"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Rename
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="text-xs gap-2 text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <RenameFileDialog
                    isOpen={isRenameDialogOpen}
                    onClose={() => setIsRenameDialogOpen(false)}
                    onRename={handleRenameSubmit}
                    currentFilename={file.filename}
                    currentExtension={file.fileExtension}
                />

                <DeleteDialog
                    isOpen={isDeleteDialogOpen}
                    setIsOpen={setIsDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Delete File"
                    description={`Are you sure you want to delete "${fileName}"? This action cannot be undone.`}
                    itemName={fileName}
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                />
            </SidebarMenuItem>
        );
    }

    // FOLDER NODE
    const folder = item as TemplateFolder;
    const folderName = folder.folderName;

    const currentPath = path
        ? `${path}/${folderName}`
        : folderName;

    const sortedChildren = sortItems(folder.items);

    const confirmDelete = () => {
        onDeleteFolder?.(folder, path);
        setIsDeleteDialogOpen(false);
    };

    const handleCreateFile = (
        filename: string,
        extension: string
    ) => {
        if (onAddFile) {
            onAddFile(
                {
                    filename,
                    fileExtension: extension,
                    content: "",
                },
                currentPath
            );

            setIsOpen(true);
        }

        setIsNewFileDialogOpen(false);
    };

    const handleCreateFolder = (newFolderName: string) => {
        if (onAddFolder) {
            onAddFolder(
                {
                    folderName: newFolderName,
                    items: [],
                },
                currentPath
            );

            setIsOpen(true);
        }

        setIsNewFolderDialogOpen(false);
    };

    const handleRenameSubmit = (newFolderName: string) => {
        onRenameFolder?.(folder, newFolderName, path);
        setIsRenameDialogOpen(false);
    };

    return (
        <SidebarMenuItem>
            <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="group/collapsible"
            >
                <div className="group/row flex items-center h-7 rounded-md px-1.5 text-[13px] text-foreground/85 hover:bg-muted/50 hover:text-foreground transition-colors">
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="h-full flex-1 bg-transparent hover:bg-transparent active:bg-transparent p-0 gap-1.5 overflow-hidden">
                            <ChevronRight
                                className={cn(
                                    "h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-150",
                                    isOpen && "rotate-90"
                                )}
                            />

                            {isOpen ? (
                                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
                            ) : (
                                <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
                            )}

                            <span className="truncate font-medium leading-none">
                                {folderName}
                            </span>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsNewFileDialogOpen(true);
                            }}
                            className="h-5 w-5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="New File inside folder"
                        >
                            <FilePlus className="h-3 w-3" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted data-[state=open]:opacity-100"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                    onClick={() => setIsNewFileDialogOpen(true)}
                                    className="text-xs gap-2"
                                >
                                    <FilePlus className="h-3.5 w-3.5" />
                                    New File
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => setIsNewFolderDialogOpen(true)}
                                    className="text-xs gap-2"
                                >
                                    <FolderPlus className="h-3.5 w-3.5" />
                                    New Folder
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => setIsRenameDialogOpen(true)}
                                    className="text-xs gap-2"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Rename
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    className="text-xs gap-2 text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Folder
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <CollapsibleContent>
                    <SidebarMenuSub className="ml-3 pl-2 border-l border-border/40 group-hover/collapsible:border-border/80 transition-colors my-0.5 py-0 gap-0.5">
                        {sortedChildren.length > 0 ? (
                            sortedChildren.map((childItem, index) => {
                                const key =
                                    childItem && "folderName" in childItem
                                        ? `folder-${childItem.folderName}-${index}`
                                        : childItem
                                            ? `file-${childItem.filename}.${childItem.fileExtension}-${index}`
                                            : index;

                                return (
                                    <TemplateNode
                                        key={key}
                                        item={childItem}
                                        onFileSelect={onFileSelect}
                                        selectedFile={selectedFile}
                                        level={level + 1}
                                        path={currentPath}
                                        onAddFile={onAddFile}
                                        onAddFolder={onAddFolder}
                                        onDeleteFile={onDeleteFile}
                                        onDeleteFolder={onDeleteFolder}
                                        onRenameFile={onRenameFile}
                                        onRenameFolder={onRenameFolder}
                                    />
                                );
                            })
                        ) : (
                            <div className="py-1 pl-4 text-[11px] italic text-muted-foreground/50">
                                Empty folder
                            </div>
                        )}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>

            <NewFileDialog
                isOpen={isNewFileDialogOpen}
                onClose={() => setIsNewFileDialogOpen(false)}
                onCreateFile={handleCreateFile}
            />

            <NewFolderDialog
                isOpen={isNewFolderDialogOpen}
                onClose={() => setIsNewFolderDialogOpen(false)}
                onCreateFolder={handleCreateFolder}
            />

            <RenameFolderDialog
                isOpen={isRenameDialogOpen}
                onClose={() => setIsRenameDialogOpen(false)}
                onRename={handleRenameSubmit}
                currentFolderName={folderName}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                setIsOpen={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Delete Folder"
                description={`Are you sure you want to delete "${folderName}" and all its contents? This action cannot be undone.`}
                itemName={folderName}
                confirmLabel="Delete"
                cancelLabel="Cancel"
            />
        </SidebarMenuItem>
    );
}
