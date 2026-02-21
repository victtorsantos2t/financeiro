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
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-background/80 sticky top-0 z-40 backdrop-blur-md border-b border-border/40">
            <div className="flex items-center gap-4 md:gap-8 flex-1">
                {isDashboard ? (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="hidden md:block">
                            <ReportActions currentDate={currentDate} />
                        </div>
                        <div className="hidden md:ml-5 lg:block border-l border-border pl-4">
                            <h1 className="text-base font-bold text-foreground tracking-tight">Dashboard</h1>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[320px] group flex items-center">
                        <div className="relative flex-1 hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar transação..."
                                className="pl-12 pr-10 bg-secondary/50 border-border/50 rounded-xl h-10 focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary/20 transition-all text-[13px] shadow-none"
                            />
                        </div>
                        <div className="md:hidden">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight capitalize leading-none">
                                {pathname === '/dashboard' ? 'Visão Geral' : pathname.replace('/', '').replace(/-/g, ' ')}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sistema Integrado</p>
                        </div>
                    </div>
                )}
            </div>

            {isDashboard && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-500 hidden lg:block">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                </div>
            )}

            <div className="flex items-center gap-2 md:gap-3">
                <button
                    onClick={openCommandPalette}
                    className="md:hidden p-2.5 rounded-xl bg-card border border-border text-muted-foreground active:scale-95 transition-all shadow-sm"
                >
                    <Search className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                    <button className="hidden md:flex p-2.5 rounded-xl bg-card border border-border hover:bg-secondary transition-all text-muted-foreground hover:text-foreground shadow-sm relative group active:scale-95">
                        <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
                    </button>
                    <NotificationSheet />
                </div>
            </div>
        </header>
    );
}
