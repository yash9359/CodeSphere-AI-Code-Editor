import Link from "next/link";
import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import UserButton from "../auth/components/user-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
    return (
        <header className="sticky top-0 left-0 right-0 z-50 w-full px-4 pt-4">
            <div className="relative mx-auto grid w-full max-w-5xl grid-cols-3 items-center rounded-full border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-zinc-900/75 px-4 py-2 sm:px-6 shadow-[0_8px_30px_rgba(15,23,42,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300">

                <div className="pointer-events-none absolute inset-x-12 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 dark:via-cyan-400/40 to-transparent" />


                <div className="flex items-center justify-start ">
                    <Link
                        target="_blank"
                        href="https://github.com/yash9359/CodeSphere-AI-Code-Editor"
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <FaGithub className="h-4 w-4" />
                        <span>Docs</span>
                    </Link>
                </div>


                <div className="flex items-center justify-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 group"
                    >
                        <Image
                            src="/CodeSphereSmall.png"
                            alt="CodeSphere Logo"
                            height={36}
                            width={36}
                            className="h-8 w-8 sm:h-9 sm:w-9 object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                        <span className="hidden md:inline-block font-bold text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                            CodeSphere{" "}
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-cyan-400 dark:via-blue-500 dark:to-violet-500 bg-clip-text text-transparent">
                                AI Editor
                            </span>
                        </span>
                    </Link>
                </div>


                <div className="flex items-center justify-end gap-2.5 sm:gap-3">
                    <ThemeToggle />
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
                    <UserButton />
                </div>
            </div>
        </header>
    );
}