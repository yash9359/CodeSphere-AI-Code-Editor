import { Header } from "@/modules/home/header";
import Footer from "@/modules/home/footer";
import { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: {
        template: "CodeSphere - Editor",
        default: "Code Editor For EliteCoders",
    },
};

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-gradient-to-b from-slate-50 via-[#f4f7fc] to-slate-100/90 dark:bg-none dark:bg-background">

            <div
                className={cn(
                    "pointer-events-none fixed inset-0",
                    "[background-size:32px_32px]",
                    "[background-image:linear-gradient(to_right,#0f172a0f_1px,transparent_1px),linear-gradient(to_bottom,#0f172a0f_1px,transparent_1px)]",
                    "[mask-image:radial-gradient(ellipse_75%_65%_at_50%_42%,#000_45%,transparent_100%)]",
                    "dark:[background-image:linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]"
                )}
            />

            <div className="pointer-events-none fixed -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-sky-400/20 dark:bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 h-[22rem] w-[34rem] rounded-full bg-indigo-400/12 dark:bg-blue-500/5 blur-3xl" />
            <div className="pointer-events-none fixed -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-violet-400/20 dark:bg-violet-500/10 blur-3xl" />

            <Header />
            <main className="relative z-20 flex-1 w-full">
                {children}
            </main>
            <Footer />
        </div>
    );
}