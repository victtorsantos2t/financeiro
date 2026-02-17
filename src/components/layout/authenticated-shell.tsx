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
        <div className="flex min-h-screen">
            <Sidebar />
            <BottomNav />
            <div className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen transition-all duration-300 pb-20 md:pb-0">
                <Header />
                <CommandPalette />
                <main className="flex-1 px-4 md:px-8 pt-4 pb-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
