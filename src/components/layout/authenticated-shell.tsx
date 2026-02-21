"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Routes where the system UI should NOT be visible
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-background">
            <Sidebar />
            <BottomNav />
            <div className="flex-1 ml-0 md:ml-60 flex flex-col h-full min-h-0 relative overflow-hidden transition-all duration-300">
                <Header />
                <CommandPalette />
                <main className="flex-1 overflow-y-auto overflow-x-hidden pt-2 px-4 md:px-6 pb-24 md:pb-6 scrollbar-hide pt-safe pb-safe">
                    {children}
                </main>
            </div>
        </div>
    );
}
