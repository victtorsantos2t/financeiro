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
    LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
    isCollapsed = false
}: {
    className?: string,
    onNavItemClick?: () => void,
    isCollapsed?: boolean
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
            "flex flex-col h-full bg-white border-r border-slate-100 overflow-y-auto scrollbar-hide transition-all duration-300",
            isCollapsed ? "w-20" : "w-60",
            className
        )}>
            {/* Header / Logo Section */}
            <div className={cn("mb-2", isCollapsed ? "p-4 flex justify-center" : "p-6")}>
                {isCollapsed ? (
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="text-primary font-black text-xl">F</span>
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-tight">Financeiro</h1>
                        <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5">Enterprise System</p>
                    </>
                )}
            </div>

            <nav className={cn("flex-1 space-y-6", isCollapsed ? "px-2" : "px-3")}>
                {navSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        {!isCollapsed && (
                            <h3 className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</h3>
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
                                            "flex items-center rounded-xl transition-all duration-200 group text-[13px]",
                                            isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2",
                                            isActive
                                                ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <item.icon className={cn(
                                            "h-[18px] w-[18px]",
                                            isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900"
                                        )} strokeWidth={isActive ? 2.5 : 2} />
                                        {!isCollapsed && <span className="tracking-tight">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile & Logout Section */}
            <div className={cn("mt-auto border-t border-slate-100", isCollapsed ? "p-2" : "p-3")}>
                <div className={cn("flex items-center mb-2", isCollapsed ? "justify-center" : "gap-2.5 p-2")}>
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-bold text-slate-900 truncate leading-none mb-0.5">{displayName}</span>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase truncate tracking-wider">{profile?.occupation || "Usuário"}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center rounded-xl text-[13px] font-bold text-slate-400 hover:text-destructive hover:bg-destructive/5 transition-all group",
                        isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2 w-full"
                    )}
                    title={isCollapsed ? "Sair do Sistema" : undefined}
                >
                    <LogOut className="h-[18px] w-[18px] text-slate-300 group-hover:text-destructive transition-colors" />
                    {!isCollapsed && <span>Sair do Sistema</span>}
                </button>
            </div>
        </aside>
    );
}
