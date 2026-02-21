"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Wallet,
    ArrowRightLeft,
    LineChart,
    Settings,
    LogOut,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navSections = [
    {
        title: "Workspace",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        ]
    },
    {
        title: "Financeiro",
        items: [
            { icon: Wallet, label: "Minha Carteira", href: "/wallet" },
            { icon: ArrowRightLeft, label: "Transações", href: "/transactions" },
        ]
    },
    {
        title: "Relatórios & BI",
        items: [
            { icon: LineChart, label: "Analytics BI", href: "/analytics" },
        ]
    },
    {
        title: "Sistema",
        items: [
            { icon: Settings, label: "Configurações", href: "/settings" },
        ]
    }
];

export function Sidebar({
    className,
    onNavItemClick,
    isCollapsed = false,
    onToggleCollapse
}: {
    className?: string,
    onNavItemClick?: () => void,
    isCollapsed?: boolean,
    onToggleCollapse?: () => void
}) {
    const pathname = usePathname();
    const [profile, setProfile] = useState<{ name: string; avatar_url: string | null; occupation: string } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('name, avatar_url, occupation')
                    .eq('id', user.id)
                    .single();

                if (data) setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const displayName = profile?.name || "Usuário";
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <aside className={cn(
            "flex flex-col h-full bg-white dark:bg-[#1C1C1E] transition-all duration-300 relative z-50",
            isCollapsed ? "w-[72px]" : "w-60",
            className
        )}>

            {/* Logo Section */}
            <div className={cn(
                "mb-6 flex items-center shrink-0",
                isCollapsed ? "pt-6 pb-3 justify-center" : "pt-6 pb-3 px-5 justify-between items-start"
            )}>
                {!isCollapsed ? (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-300 px-1">
                        <Image
                            src="/images/logo-vicnex.png"
                            alt="VICNEX Logo"
                            width={140}
                            height={40}
                            className="dark:brightness-0 dark:invert"
                            priority
                        />
                    </div>
                ) : null}
            </div>

            {/* Scrollable Navigation */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-1">
                <nav className="space-y-6">
                    {navSections.map((section) => (
                        <div key={section.title} className="space-y-1">
                            {!isCollapsed && (
                                <h3 className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] opacity-80">{section.title}</h3>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={onNavItemClick}
                                            className={cn(
                                                "flex items-center rounded-xl transition-all duration-200 group text-[13px] relative",
                                                isCollapsed ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3 py-2.5",
                                                isActive
                                                    ? "bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                                                    : "text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            <item.icon className={cn(
                                                "h-[18px] w-[18px] shrink-0 transition-colors",
                                                isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                            )} strokeWidth={isActive ? 2.5 : 2} />
                                            {!isCollapsed && <span className="tracking-tight">{item.label}</span>}

                                            {/* Active indicator bar */}
                                            {isActive && !isCollapsed && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Footer Area */}
            <div className={cn("mt-auto border-t border-slate-100 dark:border-white/5 shrink-0", isCollapsed ? "p-3" : "p-4 px-5")}>
                <div className={cn("flex items-center mb-4", isCollapsed ? "justify-center" : "gap-3")}>
                    <Avatar className="h-8 w-8 border-2 border-white dark:border-[#2C2C2E] shadow-sm ring-1 ring-slate-100 dark:ring-white/5">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-none mb-0.5">{displayName}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase truncate tracking-wider">Membro Premium</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center rounded-xl text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all group",
                        isCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2 w-full"
                    )}
                    title={isCollapsed ? "Sair do Sistema" : undefined}
                >
                    <LogOut className="h-[17px] w-[17px] text-muted-foreground opacity-60 group-hover:text-destructive transition-colors" />
                    {!isCollapsed && <span>Sair do Sistema</span>}
                </button>
            </div>
        </aside>
    );
}
