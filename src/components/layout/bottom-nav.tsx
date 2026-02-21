"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowRightLeft, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: LayoutDashboard, label: "Conta", href: "/dashboard" },
        { icon: Wallet, label: "Cartões", href: "/wallet" },
        // FAB (Pix) goes here
        { icon: ArrowRightLeft, label: "Pagamentos", href: "/transactions" },
        { icon: Menu, label: "Mais", href: "/settings" },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex items-center justify-between px-4 pb-safe">
            {/* Left Items */}
            <div className="flex flex-1 justify-around items-stretch h-full">
                {navItems.slice(0, 2).map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center min-w-[64px] transition-all duration-300",
                                active ? "text-primary" : "text-slate-400"
                            )}
                        >
                            {/* Blue Indicator Line at Top */}
                            {active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-b-full shadow-[0_2px_4px_rgba(59,130,246,0.3)]" />
                            )}
                            <item.icon className="h-6 w-6 mb-1" strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Central FAB (Style: Pix/Mint Glow) */}
            <div className="relative -top-6 flex flex-col items-center">
                <AddTransactionModal>
                    <button className="h-16 w-16 rounded-full bg-[#10b981] shadow-[0_4px_20px_rgba(16,185,129,0.5)] flex items-center justify-center text-white transform transition-all duration-300 hover:scale-105 active:scale-90 relative overflow-hidden group">
                        {/* Inner Gradient for Premium Look */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-8 w-8"
                        >
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        {/* Glow Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                    </button>
                </AddTransactionModal>
                <span className="text-[11px] font-bold text-slate-900 mt-2">Pix</span>
            </div>

            {/* Right Items */}
            <div className="flex flex-1 justify-around items-stretch h-full">
                {navItems.slice(2, 4).map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center min-w-[64px] transition-all duration-300",
                                active ? "text-primary" : "text-slate-400"
                            )}
                        >
                            {/* Blue Indicator Line at Top */}
                            {active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-b-full shadow-[0_2px_4px_rgba(59,130,246,0.3)]" />
                            )}
                            <item.icon className="h-6 w-6 mb-1" strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
