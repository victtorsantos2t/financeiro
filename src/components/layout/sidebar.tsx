"use client";

import Link from "next/link";
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

const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
    { icon: Wallet, label: "Carteira", href: "/wallet" },
    { icon: ArrowRightLeft, label: "Transações", href: "/transactions" },
    { icon: LineChart, label: "Análise de Receita", href: "/analytics" },
];

const secondaryNavItems = [
    { icon: Settings, label: "Configurações", href: "/settings" },
];

export function Sidebar() {
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

                if (data) {
                    setProfile(data);
                }
            }
        };

        fetchProfile();
    }, []);

    const displayName = profile?.name || "Usuário";
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login"; // Force a full reload to clear all states/caches
    };

    return (
        <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 border-r border-slate-100 bg-white/80 backdrop-blur-xl text-slate-900 flex-col p-8 overflow-y-auto">
            <div className="flex flex-col items-center mb-12 p-2">
                <Avatar className="h-20 w-20 mb-5 border-[6px] border-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                    <AvatarFallback className="bg-blue-500 text-white font-semibold text-xl">{initials}</AvatarFallback>
                </Avatar>
                <h2 className="font-semibold text-center text-[15px] text-slate-900 mb-1 tracking-tight">{displayName}</h2>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">{profile?.occupation || "Designer"}</p>
            </div>

            <nav className="flex-1 space-y-1.5">
                {mainNavItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-4 px-5 py-3.5 rounded-[16px] transition-all duration-300 group ${item.active
                            ? "bg-blue-50/50 text-blue-600 font-semibold border border-blue-500/10"
                            : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/80"
                            }`}
                    >
                        <item.icon className={`h-[18px] w-[18px] ${item.active ? "text-blue-500" : "group-hover:text-slate-900"}`} />
                        <span className="text-[13px] tracking-tight">{item.label}</span>
                    </Link>
                ))}

                <div className="pt-8 mt-8 border-t border-slate-50 space-y-1.5">
                    {secondaryNavItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-4 px-5 py-3.5 rounded-[16px] text-slate-400 hover:text-slate-900 hover:bg-slate-50/80 transition-all group"
                        >
                            <item.icon className="h-[18px] w-[18px] group-hover:text-slate-900" />
                            <span className="text-[13px] tracking-tight">{item.label}</span>
                        </Link>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-5 py-3.5 rounded-[16px] text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all group w-full text-left"
                    >
                        <LogOut className="h-[18px] w-[18px] group-hover:text-rose-500" />
                        <span className="text-[13px] tracking-tight">Sair</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
}
