"use client";
import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import LogoutButton from "./logout-button";
import { useCurrentUser } from "../hooks/use-current-user";

const UserButton = () => {
    const user = useCurrentUser();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
                <div
                    className={cn(
                        "relative rounded-full ring-1 ring-slate-200 dark:ring-white/10 transition-all duration-200 hover:ring-2 hover:ring-indigo-500/50 dark:hover:ring-cyan-400/50"
                    )}
                >
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        <AvatarImage
                            src={user?.image ?? ""}
                            alt={user?.name ?? "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-violet-600 text-white">
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                alignOffset={-12}
                sideOffset={16}
                className="w-60 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-1.5 shadow-xl backdrop-blur-xl"
            >
                <DropdownMenuLabel className="font-normal px-2.5 py-2">
                    <div className="flex flex-col space-y-1">
                        {user?.name && (
                            <p className="text-sm font-semibold leading-none text-slate-900 dark:text-white truncate">
                                {user.name}
                            </p>
                        )}
                        <p className="text-xs leading-none text-slate-500 dark:text-zinc-400 truncate">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-slate-200/70 dark:bg-white/10 my-1" />

                <LogoutButton>
                    <DropdownMenuItem className="cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </LogoutButton>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserButton;