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
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50/60 dark:bg-background">

            <div
                className={cn(
                    "pointer-events-none fixed inset-0",
                    "[background-size:32px_32px]",
                    "[background-image:linear-gradient(to_right,#0f172a0a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a0a_1px,transparent_1px)]",
                    "dark:[background-image:linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]"
                )}
            />


            <div className="pointer-events-none fixed inset-0 bg-slate-50/40 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,transparent_30%,black)] dark:bg-background" />


            <div className="pointer-events-none fixed -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none fixed -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet-400/20 dark:bg-violet-500/10 blur-3xl" />

            <Header />
            <main className="relative z-20 flex-1 w-full">
                {children}
            </main>
            <Footer />
        </div>
    );
}