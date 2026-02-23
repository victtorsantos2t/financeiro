"use client";

import { Search, Bell, MessageSquare, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/dashboard-context";
import { MonthSelector } from "@/features/shared/month-selector";
import { AddTransactionModal } from "@/features/transactions/add-transaction-modal";
import { ImportTransactionsModal } from "@/features/transactions/import-transactions-modal";
import { NotificationSheet } from "@/features/shared/notification-sheet";
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
        <header className="h-[62px] mt-4 mx-6 rounded-lg flex items-center justify-between px-4 md:px-6 bg-white dark:bg-[#2C2C2E] shadow-sm border border-[#E0E2E7] dark:border-white/5 sticky top-4 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4 md:gap-6 flex-1">
                {isDashboard ? (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                        <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">Visão Geral</h1>
                        <p className="text-[11px] font-medium text-muted-foreground tracking-wide mt-1">Desempenho financeiro consolidado.</p>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[320px] group flex items-center">
                        <div className="relative flex-1 hidden md:block">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#7367F0] transition-colors" />
                            <Input
                                placeholder="Search (Ctrl+K)"
                                className="pl-8 bg-transparent border-none rounded-none h-10 focus-visible:ring-0 focus-visible:border-none transition-all text-[14px] text-slate-500 shadow-none px-0"
                            />
                        </div>
                        <div className="md:hidden">
                            <h1 className="text-xl font-black text-foreground tracking-tight capitalize leading-none">
                                {pathname === '/dashboard' ? 'Visão Geral' : pathname.replace('/', '').replace(/-/g, ' ')}
                            </h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Sistema Integrado</p>
                        </div>
                    </div>
                )}
            </div>

            {isDashboard && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-500 hidden lg:block">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                </div>
            )}

            <div className="flex items-center gap-3 md:gap-4">
                {/* Global Desktop Actions */}
                <div className="hidden lg:flex items-center gap-3">
                    <ImportTransactionsModal />
                    <AddTransactionModal />
                </div>

                <div className="flex items-center gap-2">
                    <NotificationSheet />
                </div>
            </div>
        </header>
    );
}
