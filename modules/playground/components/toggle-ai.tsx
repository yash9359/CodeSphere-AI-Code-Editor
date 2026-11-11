"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Bot,
    Code,
    FileText,
    Import,
    Loader2,
    Power,
    PowerOff,
    Braces,
    Variable
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { AIChatSidePanel } from "@/modules/ai-chat/components/ai-chat-sidebarpanel";



interface ToggleAIProps {
    isEnabled: boolean;
    onToggle: (value: boolean) => void;

    suggestionLoading: boolean;
    loadingProgress?: number;
    activeFeature?: string;
}

const ToggleAI: React.FC<ToggleAIProps> = ({
    isEnabled,
    onToggle,

    suggestionLoading,
    loadingProgress = 0,
    activeFeature,
}) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { resolvedTheme } = useTheme();
    const activeTheme: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark";


    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="sm"
                        variant={isEnabled ? "default" : "outline"}
                        className={cn(
                            "relative gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                            isEnabled
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-[0_2px_10px_rgba(79,70,229,0.22)] dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200 dark:shadow-none"
                                : "bg-card/80 dark:bg-background hover:bg-accent text-foreground border-border",
                            suggestionLoading && "opacity-75"
                        )}
                        onClick={(e) => e.preventDefault()}
                    >
                        {suggestionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Bot className="h-4 w-4" />
                        )}
                        <span>AI</span>
                        {isEnabled ? (
                            <div className="w-2 h-2 bg-emerald-300 dark:bg-green-500 rounded-full animate-pulse" />
                        ) : (
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">AI Assistant</span>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs",
                                isEnabled
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-200"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {isEnabled ? "Active" : "Inactive"}
                        </Badge>
                    </DropdownMenuLabel>

                    {suggestionLoading && activeFeature && (
                        <div className="px-3 pb-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{activeFeature}</span>
                                    <span>{Math.round(loadingProgress)}%</span>
                                </div>
                                <Progress
                                    value={loadingProgress}
                                    className="h-1.5"
                                />
                            </div>
                        </div>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => onToggle(!isEnabled)}
                        className="py-2.5 cursor-pointer"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                {isEnabled ? (
                                    <Power className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <PowerOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div>
                                    <div className="text-sm font-medium">
                                        {isEnabled ? "Disable" : "Enable"} AI
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Toggle AI assistance
                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "w-8 h-4 rounded-full border transition-all duration-200 relative",
                                isEnabled
                                    ? "bg-indigo-600 border-indigo-600 dark:bg-zinc-50 dark:border-zinc-50"
                                    : "bg-muted border-border"
                            )}>
                                <div className={cn(
                                    "w-3 h-3 rounded-full bg-white dark:bg-zinc-900 shadow-2xs transition-all duration-200 absolute top-0.5",
                                    isEnabled ? "left-4" : "left-0.5"
                                )} />
                            </div>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setIsChatOpen(true)}
                        className="py-2.5 cursor-pointer"
                    >
                        <div className="flex items-center gap-3 w-full">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">Open Chat</div>
                                <div className="text-xs text-muted-foreground">
                                    Chat with AI assistant
                                </div>
                            </div>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AIChatSidePanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                // onInsertCode={handleInsertCode}
                // onRunCode={handleRunCode}
                // activeFileName={activeFile?.name}
                // activeFileContent={activeFile?.content}
                activeFileLanguage="TypeScript" // Assuming TypeScript as the language
                // cursorPosition={cursorPosition}
                theme={activeTheme}
            />
        </>
    );
};

export default ToggleAI;