"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AddTransactionModal } from "@/features/transactions/add-transaction-modal";

// Ícones SVG inline no estilo SF Symbols para iOS nativo
const TabIcons = {
    dashboard: ({ active }: { active: boolean }) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <path d="M4 13.5h7V4.5H4v9zm0 7h7v-5H4v5zm9 0h7v-9h-7v9zm0-16v5h7v-5h-7z"
                fill={active ? "#007AFF" : "#8E8E93"}
                fillOpacity={active ? 1 : 0.9}
            />
        </svg>
    ),
    wallet: ({ active }: { active: boolean }) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <path d="M21 7.25H4a.75.75 0 010-1.5h17a.75.75 0 010 1.5zM3.25 5.5v13A2.25 2.25 0 005.5 20.75h14a2.25 2.25 0 002.25-2.25V9.5A2.25 2.25 0 0019.5 7.25H5.5A2.25 2.25 0 003.25 9.5V5.5z"
                fill={active ? "#007AFF" : "#8E8E93"}
            />
            <circle cx="17" cy="14" r="1.5" fill={active ? "white" : "#F2F2F7"} />
        </svg>
    ),
    add: () => (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#007AFF" />
            <path d="M14 8.5v11M8.5 14h11" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    ),
    transactions: ({ active }: { active: boolean }) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <path d="M17 3.5L21 7.5L17 11.5M4 7.5H21M8 13.5L4 17.5L8 21.5M21 17.5H4"
                stroke={active ? "#007AFF" : "#8E8E93"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    menu: ({ active }: { active: boolean }) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <path d="M4 6.5h17M4 12.5h17M4 18.5h17"
                stroke={active ? "#007AFF" : "#8E8E93"}
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    ),
};

export function BottomNav({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();

    const navItems = [
        { key: "dashboard", label: "Conta", href: "/dashboard" },
        { key: "wallet", label: "Carteira", href: "/wallet" },
        { key: "add", label: "Novo", action: "add" },
        { key: "transactions", label: "Transações", href: "/transactions" },
        { key: "menu", label: "Menu", action: "menu" },
    ];

    const isActive = (href?: string) => href ? pathname === href : false;

    return (
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around px-1 transition-colors duration-300"
            style={{
                height: '83px',
                background: 'var(--ios-tab-blur, rgba(249,249,249,0.94))',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderTop: '0.5px solid var(--ios-separator, rgba(0,0,0,0.15))',
                paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
            }}
        >
            {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = TabIcons[item.key as keyof typeof TabIcons];

                // Botão central ADD
                if (item.action === "add") {
                    return (
                        <AddTransactionModal key="add">
                            <button className="flex flex-col items-center justify-center gap-[3px] px-3 pt-2 active:opacity-60 transition-opacity">
                                <TabIcons.add />
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 400,
                                    color: '#007AFF',
                                    letterSpacing: '-0.1px',
                                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
                                }}>
                                    {item.label}
                                </span>
                            </button>
                        </AddTransactionModal>
                    );
                }

                // Botão MENU
                if (item.action === "menu") {
                    return (
                        <button
                            key="menu"
                            onClick={onMenuClick}
                            className="flex flex-col items-center justify-center gap-[3px] px-3 pt-2 active:opacity-60 transition-opacity"
                        >
                            <TabIcons.menu active={false} />
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 400,
                                color: '#8E8E93',
                                letterSpacing: '-0.1px',
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
                            }}>
                                {item.label}
                            </span>
                        </button>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href!}
                        className="flex flex-col items-center justify-center gap-[3px] px-3 pt-2 active:opacity-60 transition-opacity"
                    >
                        <Icon active={active} />
                        <span style={{
                            fontSize: '10px',
                            fontWeight: active ? 500 : 400,
                            color: active ? '#007AFF' : '#8E8E93',
                            letterSpacing: '-0.1px',
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
                        }}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
