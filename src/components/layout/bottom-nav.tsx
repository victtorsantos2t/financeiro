"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowRightLeft, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";

export function BottomNav({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();

    const navItems = [
        { icon: LayoutDashboard, label: "Conta", href: "/dashboard" },
        { icon: Wallet, label: "Cartões", href: "/wallet" },
        { icon: Plus, label: "Pix", action: "add" }, // Special action for Add/Pix
        { icon: ArrowRightLeft, label: "Carteira", href: "/transactions" },
        { icon: Menu, label: "Menu", action: "menu" }, // Trigger Sidebar
    ];

    const isActive = (path?: string) => path ? pathname === path : false;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50 flex items-center justify-around px-2 pb-safe">
            {navItems.map((item) => {
                const active = isActive(item.href);

                const content = (
                    <div className={cn(
                        "flex flex-col items-center justify-center min-w-[64px] transition-all duration-300 gap-1",
                        active ? "text-primary" : "text-slate-400"
                    )}>
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                            active && "bg-primary/5"
                        )}>
                            <item.icon
                                className={cn("h-6 w-6")}
                                strokeWidth={active ? 2.5 : 2}
                            />
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold tracking-tight uppercase",
                            active ? "text-primary" : "text-slate-400"
                        )}>{item.label}</span>
                    </div>
                );

                if (item.action === "add") {
                    return (
                        <AddTransactionModal key={item.label}>
                            <button className="flex flex-col items-center justify-center min-w-[64px] gap-1 active:scale-95 transition-transform text-slate-400 hover:text-primary">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl">
                                    <item.icon className="h-6 w-6" strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-bold tracking-tight uppercase">{item.label}</span>
                            </button>
                        </AddTransactionModal>
                    );
                }

                if (item.action === "menu") {
                    return (
                        <button
                            key={item.label}
                            onClick={onMenuClick}
                            className="flex flex-col items-center justify-center min-w-[64px] gap-1 active:scale-95 transition-transform text-slate-400 hover:text-primary"
                        >
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl">
                                <item.icon className="h-6 w-6" strokeWidth={2} />
                            </div>
                            <span className="text-[10px] font-bold tracking-tight uppercase">{item.label}</span>
                        </button>
                    );
                }

                return (
                    <Link key={item.href} href={item.href!} className="active:scale-95 transition-transform">
                        {content}
                    </Link>
                );
            })}
        </div>
    );
}
