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
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <>
            {/* ═══ MOBILE — iOS Native Layout ═══════════════════════════════════════ */}
            <div
                className="md:hidden flex flex-col h-dvh w-full overflow-hidden"
                style={{
                    background: '#F2F2F7',
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif"
                }}
            >
                {/* Drawer Sidebar (mobile) */}
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetContent side="left" className="p-0 border-none w-[85vw] max-w-[340px] bg-white" showCloseButton={false}>
                        <Sidebar className="w-full h-full border-none" onNavItemClick={() => setIsSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* iOS Tab Bar (fixed bottom) */}
                <BottomNav onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Scrollable content area */}
                <main
                    className="flex-1 overflow-y-auto overflow-x-hidden pb-[83px] scrollbar-hide"
                    style={{ WebkitOverflowScrolling: 'touch' as const }}
                >
                    {children}
                </main>
            </div>

            {/* ═══ DESKTOP — SaaS Card Layout ═══════════════════════════════════════ */}
            <div className="hidden md:flex h-dvh w-full overflow-hidden bg-[#ECEEF2] p-4 gap-3">
                {/* Sidebar (desktop) */}
                <div className="flex shrink-0 relative">
                    <Sidebar
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                        className="rounded-[24px] shadow-sm border border-white/80 h-full overflow-hidden"
                    />
                    {/* Floating toggle button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-4 top-10 z-[70] flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 shadow-md hover:shadow-lg hover:text-blue-600 hover:border-blue-200 transition-all active:scale-90"
                        title={isCollapsed ? "Expandir" : "Recolher"}
                    >
                        {isCollapsed
                            ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        }
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden bg-white rounded-[24px] shadow-sm border border-white/80">
                    <Header />
                    <CommandPalette />
                    <main className="flex-1 overflow-y-auto overflow-x-hidden pt-6 px-6 pb-6 scrollbar-hide">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
