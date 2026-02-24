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
        <header className="h-[62px] mt-4 mx-6 rounded-none flex items-center justify-between px-4 md:px-6 bg-card border-2 border-border sticky top-4 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                {isDashboard ? (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                        <h1 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">Visão Geral</h1>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[320px] group flex items-center">
                        <div className="relative flex-1 hidden md:block">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search (Ctrl+K)"
                                className="pl-6 pr-0 bg-transparent border-none rounded-none h-10 focus-visible:ring-0 focus-visible:border-none transition-all text-xs font-black uppercase tracking-widest text-muted-foreground shadow-none"
                            />
                        </div>
                        <div className="md:hidden">
                            <h1 className="text-xl font-black text-foreground tracking-tight uppercase leading-none">
                                {pathname === '/dashboard' ? 'VISÃO GERAL' : pathname.replace('/', '').replace(/-/g, ' ')}
                            </h1>
                        </div>
                    </div>
                )}
            </div>

            {isDashboard && (
                <div className="hidden lg:flex flex-none justify-center items-center animate-in fade-in zoom-in-95 duration-500 mx-4">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                </div>
            )}

            {!isDashboard && <div className="hidden lg:block flex-1" />}

            <div className="flex items-center justify-end gap-3 md:gap-4 flex-1 min-w-0 shrink-0">
                {/* Global Desktop Actions */}
                <div className="hidden xl:flex items-center gap-3">
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

// aria-label
