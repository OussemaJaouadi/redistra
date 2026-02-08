import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

/**
 * Dashboard layout - Server component with server-side auth
 * Middleware handles redirects, this verifies and provides user context
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }
    
    return (
        <SidebarProvider className="h-svh overflow-hidden">
            <AppSidebar />
            <SidebarInset className="min-h-svh overflow-hidden">
                <AppHeader />
                <main className="min-h-0 flex-1 p-4 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
