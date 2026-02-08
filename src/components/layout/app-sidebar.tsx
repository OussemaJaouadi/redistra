"use client";

import * as React from "react";
import Image from "next/image";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useLogout, useMe } from "@/lib/api";
import { navItems } from "./nav-data";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignOut, User } from "@phosphor-icons/react";
import type { MeResponseDto } from "@/types";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: meData } = useMe();
    const logout = useLogout();
    const me = (meData?.data ?? (meData as unknown as MeResponseDto | undefined)) ?? undefined;
    const username = me?.user?.username ?? "Account";

    const handleLogout = async () => {
        await logout.mutateAsync();
        router.push("/login");
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <Image
                                    src="/Redistra.png"
                                    alt="RediStra"
                                    width={32}
                                    height={32}
                                    className="size-8 object-contain"
                                />
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">RediStra</span>
                                    <span className="truncate text-xs">Redis Manager</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="size-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border pt-2 mt-auto">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" tooltip={username}>
                            <User className="size-5" />
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold">{username}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            onClick={handleLogout}
                            disabled={logout.isPending}
                            tooltip="Sign out"
                            className="text-destructive border border-destructive/40 hover:bg-destructive/10 hover:border-destructive/60"
                        >
                            <SignOut className="size-4" />
                            <span className="group-data-[collapsible=icon]:hidden">{logout.isPending ? "Signing out..." : "Sign out"}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
