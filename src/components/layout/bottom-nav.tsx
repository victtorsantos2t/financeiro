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
        <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/80 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 flex items-center justify-between px-6 transition-all duration-300">
            {/* Left Items */}
            <div className="flex gap-1">
                {navItems.slice(0, 2).map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                            isActive(item.href)
                                ? "text-primary bg-primary/10"
                                : "text-slate-400 hover:text-slate-600 active:scale-95"
                        )}
                    >
                        <item.icon
                            className="h-6 w-6"
                            strokeWidth={isActive(item.href) ? 2.5 : 2}
                        />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* Central FAB - Floating Higher */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                <AddTransactionModal>
                    <button className="h-16 w-16 rounded-full bg-primary shadow-xl shadow-primary/40 flex items-center justify-center text-white transform transition-all duration-300 hover:scale-105 active:scale-95 active:shadow-sm">
                        <Plus className="h-8 w-8" strokeWidth={3} />
                    </button>
                </AddTransactionModal>
            </div>

            {/* Right Items */}
            <div className="flex gap-1">
                {navItems.slice(2, 4).map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                            isActive(item.href)
                                ? "text-primary bg-primary/10"
                                : "text-slate-400 hover:text-slate-600 active:scale-95"
                        )}
                    >
                        <item.icon
                            className="h-6 w-6"
                            strokeWidth={isActive(item.href) ? 2.5 : 2}
                        />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
