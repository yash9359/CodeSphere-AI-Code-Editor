import { SidebarProvider } from "@/components/ui/sidebar";
import { getAllPlaygroundForUser } from "@/modules/dashboard/actions";
import {
    SiReact,
    SiNextdotjs,
    SiExpress,
    SiVuedotjs,
    SiHono,
    SiAngular,
} from "react-icons/si";

import { IconType } from "react-icons";
import { DashboardSidebar } from "@/modules/dashboard/components/dashboard-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";


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
            starred: false,
            icon: item.template,
        }))?? [];

    return (
        <TooltipProvider>
            <SidebarProvider>
                <div className="flex min-h-screen w-full overflow-x-hidden">
                    <DashboardSidebar
                        initialPlaygroundData={formattedPlaygroundData}
                    />
                    <main className="
                        flex-1
                        bg-background
                                    bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.06),transparent_35%)]">
                        {children}
                    </main>
                </div>
            </SidebarProvider>
        </TooltipProvider>
    );
}
