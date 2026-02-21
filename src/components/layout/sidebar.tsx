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

const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Wallet, label: "Carteira", href: "/wallet" },
    { icon: ArrowRightLeft, label: "Transações", href: "/transactions" },
    { icon: LineChart, label: "Análise de Receita", href: "/analytics" },
];

const secondaryNavItems = [
    { icon: Settings, label: "Configurações", href: "/settings" },
];

export function Sidebar() {
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
        <aside className="hidden md:flex w-60 h-screen fixed left-0 top-0 border-r border-border bg-card text-foreground flex-col p-6 overflow-y-auto">
            <div className="flex flex-col items-center mb-10 p-2">
                <Avatar className="h-16 w-16 mb-4 border-4 border-white shadow-sm">
                    <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">{initials}</AvatarFallback>
                </Avatar>
                <h2 className="font-semibold text-center text-[15px] text-foreground mb-1 tracking-tight">{displayName}</h2>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">{profile?.occupation || "Designer"}</p>
            </div>

            <nav className="flex-1 space-y-2">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all duration-200 group ${isActive
                                ? "bg-primary text-white font-medium shadow-sm shadow-primary/20"
                                : "text-secondary-foreground hover:text-foreground hover:bg-secondary/80"
                                }`}
                        >
                            <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-white" : "group-hover:text-foreground"}`} />
                            <span className="text-[14px] font-medium tracking-tight">{item.label}</span>
                        </Link>
                    )
                })}

                <div className="pt-6 mt-6 border-t border-border space-y-2">
                    {secondaryNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all group ${isActive
                                    ? "bg-primary text-white font-medium shadow-sm shadow-primary/20"
                                    : "text-secondary-foreground hover:text-foreground hover:bg-secondary/80"
                                    }`}
                            >
                                <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-white" : "group-hover:text-foreground"}`} />
                                <span className="text-[14px] font-medium tracking-tight">{item.label}</span>
                            </Link>
                        )
                    })}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group w-full text-left"
                    >
                        <LogOut className="h-[18px] w-[18px] group-hover:text-destructive" />
                        <span className="text-[14px] font-medium tracking-tight">Sair</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
}
