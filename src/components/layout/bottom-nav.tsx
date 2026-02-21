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
        { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
        { icon: ArrowRightLeft, label: "Extrato", href: "/transactions" },
        // FAB goes here logic
        { icon: Wallet, label: "Carteira", href: "/wallet" },
        { icon: Menu, label: "Menu", href: "/settings" },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <div className="md:hidden fixed bottom-6 left-6 right-6 h-18 py-3 bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 flex items-center justify-between px-8 transition-all duration-500 hover:bg-white/80">
            {/* Left Items */}
            <div className="flex gap-4">
                {navItems.slice(0, 2).map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 relative",
                                active
                                    ? "text-primary scale-110"
                                    : "text-slate-400 hover:text-slate-600 active:scale-95"
                            )}
                        >
                            <item.icon
                                className="h-6 w-6"
                                strokeWidth={active ? 2.5 : 2}
                            />
                            {active && (
                                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
                            )}
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Central FAB - Floating Higher with Luxury Glow */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-8">
                <AddTransactionModal>
                    <button className="h-16 w-16 rounded-[24px] bg-primary shadow-[0_10px_30px_rgba(59,130,246,0.5)] flex items-center justify-center text-white transform transition-all duration-300 hover:scale-105 active:scale-90 hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)] group">
                        <Plus className="h-8 w-8 transition-transform group-hover:rotate-90 duration-500" strokeWidth={3} />
                    </button>
                </AddTransactionModal>
            </div>

            {/* Right Items */}
            <div className="flex gap-4">
                {navItems.slice(2, 4).map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 relative",
                                active
                                    ? "text-primary scale-110"
                                    : "text-slate-400 hover:text-slate-600 active:scale-95"
                            )}
                        >
                            <item.icon
                                className="h-6 w-6"
                                strokeWidth={active ? 2.5 : 2}
                            />
                            {active && (
                                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
                            )}
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
