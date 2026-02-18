"use client";

import { Search, Bell, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/dashboard-context";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { ReportActions } from "@/components/dashboard/report-actions";
import { cn } from "@/lib/utils";
import { NotificationSheet } from "@/components/dashboard/notification-sheet";
import { useState } from "react";

export function Header() {
    const pathname = usePathname();
    const isDashboard = pathname === "/dashboard";
    const { currentDate, setCurrentDate } = useDashboard();
    const [isSearchOpen, setIsSearchOpen] = useState(false); // State to toggle mobile search if needed, or just trigger command

    // Function to simulate Ctrl+K
    const openCommandPalette = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    };

    return (
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-transparent mb-2 sticky top-0 z-40 backdrop-blur-md md:backdrop-blur-sm">
            <div className="flex items-center gap-4 md:gap-8 flex-1">
                {isDashboard ? (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-500">
                        {/* On mobile, ReportActions might be too wide. Let's see ReportActions content. 
                            Assuming ReportActions is fine or will be handled. 
                            If not, we might hide it on mobile or simplify.
                        */}
                        <div className="hidden md:block">
                            <ReportActions currentDate={currentDate} />
                        </div>
                        {/* Mobile: Show simple Greeting or Title? */}
                        {/* Mobile: Show nothing if selector is visible, or keep title if wanted. 
                            Let's hide it to make room for MonthSelector in absolute center. */}
                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Dashboard</h1>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[320px] group flex items-center">
                        {/* Desktop Search */}
                        <div className="relative flex-1 hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Buscar transação..."
                                className="pl-12 pr-10 bg-slate-100/40 border-slate-100/50 rounded-[14px] h-10 focus-visible:ring-4 focus-visible:ring-blue-500/5 focus-visible:border-blue-500/20 transition-all text-[13px] shadow-none"
                            />
                        </div>
                        {/* Mobile: Page Title instead of Search */}
                        <div className="md:hidden">
                            <h1 className="text-lg font-semibold text-slate-900 tracking-tight capitalize">
                                {pathname.replace('/', '') || 'Financeiro'}
                            </h1>
                        </div>
                    </div>
                )}

            </div>

            {/* Center Section: Month Selector - Visible on Desktop, different on Mobile? 
                On Mobile, MonthSelector might be better placed below header or as a drawer.
                For now, let's keep it but ensure it doesn't overlap. 
                Actually, on mobile, the absolute centering might overlap with left/right elements if they are wide.
            */}
            {isDashboard && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-500 hidden md:block">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                </div>
            )}

            <div className="flex items-center gap-2 md:gap-3">
                {/* Mobile Search Trigger */}
                <button
                    onClick={openCommandPalette}
                    className="md:hidden p-2 rounded-xl bg-white/80 border border-slate-100 text-slate-500 backdrop-blur-sm active:scale-95 transition-all"
                >
                    <Search className="h-5 w-5" />
                </button>

                {/* Right Section: Icons */}
                <div className="flex items-center gap-2">
                    <button className="hidden md:block p-2.5 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900 shadow-sm relative group active:scale-95">
                        <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
                    </button>
                    <NotificationSheet />
                </div>
            </div>
        </header>
    );
}
