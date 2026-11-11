import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getAllPlaygroundForUser } from "@/modules/dashboard/actions";
import { DashboardSidebar } from "@/modules/dashboard/components/dashboard-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import UserButton from "@/modules/auth/components/user-button";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const playgroundData = await getAllPlaygroundForUser();

    const formattedPlaygroundData =
        playgroundData?.map((item) => ({
            id: item.id,
            name: item.title,
            starred: item.Starmark?.[0]?.isMarked || false,
            icon: item.template,
        })) ?? [];

    return (
        <TooltipProvider>
            <SidebarProvider>
                <DashboardSidebar
                    initialPlaygroundData={formattedPlaygroundData}
                />
                <SidebarInset className="overflow-x-hidden bg-background bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.05),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.06),transparent_35%)]">
                    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card/85 dark:bg-background/80 px-4 sm:px-6 backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="h-4" />
                            <span className="text-sm font-semibold tracking-tight text-foreground">
                                Dashboard
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <ThemeToggle />
                            <UserButton />
                        </div>
                    </header>
                    <div className="flex-1">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
