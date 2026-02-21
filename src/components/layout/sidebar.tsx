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

export function Sidebar({ className, onNavItemClick }: { className?: string, onNavItemClick?: () => void }) {
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
            "flex flex-col h-full bg-white border-r border-slate-100 overflow-y-auto scrollbar-hide w-64",
            className
        )}>
            {/* Header / Logo Section */}
            <div className="p-8 mb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">Financeiro</h1>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5">Enterprise System</p>
            </div>

            <nav className="flex-1 px-4 space-y-8">
                {navSections.map((section) => (
                    <div key={section.title} className="space-y-2">
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={onNavItemClick}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-[14px]",
                                            isActive
                                                ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-[20px] w-[20px]",
                                            isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900"
                                        )} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className="tracking-tight">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile & Logout Section */}
            <div className="p-4 mt-auto border-t border-slate-100">
                <div className="flex items-center gap-3 p-2 mb-4">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{displayName}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase truncate tracking-wider">{profile?.occupation || "Usuário"}</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-[14px] font-bold text-slate-400 hover:text-destructive hover:bg-destructive/5 transition-all group"
                >
                    <LogOut className="h-[20px] w-[20px] text-slate-300 group-hover:text-destructive transition-colors" />
                    <span>Sair do Sistema</span>
                </button>
            </div>
        </aside>
    );
}
