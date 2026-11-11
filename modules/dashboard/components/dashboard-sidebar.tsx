"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Code2,
    FolderPlus,
    History,
    Home,
    LayoutDashboard,
    Plus,
    Settings,
    Star,
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarGroupAction,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { Templates } from "@prisma/client"

interface PlaygroundData {
    id: string;
    name: string;
    icon: Templates;
    starred: boolean;
}

// Clean mapping without 3D glow/shadows
const technologySvgMap: Record<Templates, { src: string; className: string }> = {
    HONO: {
        src: "/hono.svg",
        className: "",
    },
    REACT: {
        src: "/react.svg",
        className: "",
    },
    NEXTJS: {
        src: "/nextjs-icon.svg",
        className: "dark:invert",
    },
    EXPRESS: {
        src: "/expressjs-icon.svg",
        className: "dark:invert",
    },
    VUE: {
        src: "/vuejs-icon.svg",
        className: "",
    },
    ANGULAR: {
        src: "/angular-2.svg",
        className: "",
    },
};

function PlaygroundTechIcon({ template }: { template: Templates }) {
    const tech = technologySvgMap[template];
    if (!tech) {
        return <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
    return (
        <div className="relative flex items-center justify-center h-4 w-4 shrink-0">
            <Image
                src={tech.src}
                alt={template}
                width={16}
                height={16}
                className={`h-4 w-4 object-contain ${tech.className}`}
            />
        </div>
    );
}

export function DashboardSidebar({ initialPlaygroundData }: { initialPlaygroundData: PlaygroundData[] }) {
    const pathname = usePathname()
    const [starredPlaygrounds, setStarredPlaygrounds] = useState(initialPlaygroundData.filter((p) => p.starred))
    const [recentPlaygrounds, setRecentPlaygrounds] = useState(initialPlaygroundData)

    return (
        <Sidebar variant="inset"
            collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-3 justify-center">
                    <Image src={"/CodeSphereSmall.png"} alt="logo" height={60} width={100} />
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Navigation Links */}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Home" className="mb-2">
                                <Link href="/">
                                    <Home className="h-4 w-4" />
                                    <span>Home</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Dashboard">
                                <Link href="/dashboard">
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Starred Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <Star className="h-4 w-4 mr-2" />
                        Starred
                    </SidebarGroupLabel>
                    <SidebarGroupAction title="Add starred playground">
                        <Plus className="h-4 w-4" />
                    </SidebarGroupAction>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {starredPlaygrounds.length === 0 && recentPlaygrounds.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4 w-full">Create your playground</div>
                            ) : (
                                starredPlaygrounds.map((playground) => (
                                    <SidebarMenuItem key={playground.id}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === `/playground/${playground.id}`}
                                            tooltip={playground.name}
                                        >
                                            <Link href={`/playground/${playground.id}`}>
                                                <PlaygroundTechIcon template={playground.icon} />
                                                <span>{playground.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Recent Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <History className="h-4 w-4 mr-2" />
                        Recent
                    </SidebarGroupLabel>
                    <SidebarGroupAction title="Create new playground">
                        <FolderPlus className="h-4 w-4" />
                    </SidebarGroupAction>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {starredPlaygrounds.length === 0 && recentPlaygrounds.length === 0 ? null : (
                                recentPlaygrounds.map((playground) => (
                                    <SidebarMenuItem key={playground.id}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === `/playground/${playground.id}`}
                                            tooltip={playground.name}
                                        >
                                            <Link href={`/playground/${playground.id}`}>
                                                <PlaygroundTechIcon template={playground.icon} />
                                                <span>{playground.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="View all">
                                    <Link href="/playgrounds">
                                        <span className="text-sm text-muted-foreground">View all playgrounds</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Settings">
                            <Link href="/settings">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}