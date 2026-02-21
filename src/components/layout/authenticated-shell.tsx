"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Routes where the system UI should NOT be visible
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="p-0 border-none w-60 bg-white" showCloseButton={false}>
                    <Sidebar className="w-full h-full border-none" onNavItemClick={() => setIsSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            <BottomNav onMenuClick={() => setIsSidebarOpen(true)} />

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
