"use client";

import { usePathname } from "next/navigation";
import { useState, Suspense } from "react";
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
                className="md:hidden flex flex-col h-dvh w-full overflow-hidden transition-colors duration-300"
                style={{
                    background: 'var(--ios-bg, #F2F2F7)',
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
                    paddingTop: 'env(safe-area-inset-top)'
                }}
            >
                {/* Drawer Sidebar (mobile) */}
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetContent side="left" className="p-0 border-none w-[85vw] max-w-[340px] bg-white dark:bg-[#1C1C1E]" showCloseButton={false}>
                        <Sidebar className="w-full h-full border-none" onNavItemClick={() => setIsSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* iOS Tab Bar (fixed bottom) */}
                <Suspense fallback={null}>
                    <BottomNav onMenuClick={() => setIsSidebarOpen(true)} />
                </Suspense>

                {/* Scrollable content area */}
                <main
                    className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
                    style={{
                        WebkitOverflowScrolling: 'touch' as const,
                        paddingBottom: 'calc(40px + max(0px, env(safe-area-inset-bottom) - 10px))'
                    }}
                >
                    {/* Páginas com layout próprio não recebem padding extra */}
                    {['/dashboard', '/settings', '/transactions'].includes(pathname) ? (
                        children
                    ) : (
                        <div className="px-4 pt-5 pb-4">
                            {children}
                        </div>
                    )}
                </main>
            </div>

            {/* ═══ DESKTOP — SaaS Card Layout ═══════════════════════════════════════ */}
            <div className="hidden md:flex h-dvh w-full overflow-hidden transition-colors duration-300">
                {/* Sidebar (desktop) */}
                <div className="flex shrink-0 relative">
                    <Sidebar
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                        className="shadow-sm border-r border-[#E0E2E7] dark:border-white/5 h-full overflow-hidden"
                    />
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-[14px] top-12 z-[70] flex items-center justify-center w-7 h-7 bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all rounded-none ring-4 ring-background shadow-sm cursor-pointer"
                        title={isCollapsed ? "Expandir" : "Recolher"}
                    >
                        {isCollapsed
                            ? <svg xmlns="http://www.w3.org/2000/svg" className="h-[14px] w-[14px] stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" /></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" className="h-[14px] w-[14px] stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" /></svg>
                        }
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden bg-[#F8F8F9] dark:bg-[#151518] transition-colors duration-300">
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

// aria-label
