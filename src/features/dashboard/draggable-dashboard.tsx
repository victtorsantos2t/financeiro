"use client";

import { useState, useEffect } from "react";
import { useWidgetStore } from "@/core/application/store/widget-store";

// Widgets atuais transformados em componentes mapeáveis
import { Wallet } from "@/features/wallets/wallet";
import { TransactionsTable } from "@/features/transactions/transactions-table";
import { MonthlyEarningsChart } from "@/features/dashboard/monthly-earnings-chart";
import { EarningsDonut } from "@/features/dashboard/earnings-donut";
import { useDashboard } from "@/context/dashboard-context";
import { AddTransactionModal } from "@/features/transactions/add-transaction-modal";
import { ImportTransactionsModal } from "@/features/transactions/import-transactions-modal";
import { PayableAccounts } from "@/features/payables/payable-accounts";
import { createClient } from "@/lib/supabase/client";
import { MonthSelector } from "@/features/shared/month-selector";
import { DashboardInsights } from "@/features/dashboard/dashboard-insights";

export default function DraggableDashboard() {
    const { layout } = useWidgetStore();
    const { currentDate, setCurrentDate } = useDashboard();
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Evita hydration mismatch
    useEffect(() => { setMounted(true); }, []);

    // Detecta mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Trigger Daily Yield Update
    useEffect(() => {
        const updateYields = async () => {
            const supabase = createClient();
            try {
                const { error } = await supabase.rpc('calculate_wallet_yields');
                if (error) console.error("Error updating yields:", error);
            } catch (err) {
                console.error("Failed to update yields:", err);
            }
        };
        updateYields();
    }, []);

    if (!mounted) return <div className="p-8 text-center text-slate-400">Carregando Dashboard...</div>;

    const renderWidget = (id: string) => {
        switch (id) {
            case 'smart-insights': return <DashboardInsights currentDate={currentDate} />;
            case 'wallet-summary': return <Wallet />;
            case 'transactions-table': return <TransactionsTable />;
            case 'monthly-chart': return <MonthlyEarningsChart currentDate={currentDate} />;
            case 'earnings-donut': return <EarningsDonut currentDate={currentDate} />;
            case 'payable-accounts': return <PayableAccounts />;
            default: return null;
        }
    };

    // Versão Mobile — iOS Native
    if (isMobile) {
        return (
            <div
                className="w-full pb-[100px]"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif" }}
            >
                {/* ── iOS Large Title Navigation Bar ───────────────────────────── */}
                <div
                    className="sticky top-0 z-40 px-4 pt-[56px] pb-4 transition-colors duration-300"
                    style={{
                        background: 'var(--ios-header-blur, rgba(242,242,247,0.92))',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        borderBottom: '0.5px solid var(--ios-separator, rgba(0,0,0,0.12))',
                    }}
                >
                    {/* Large Title */}
                    <h1 style={{
                        fontSize: '34px',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        letterSpacing: '-0.5px',
                        color: 'var(--ios-label, #000000)',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui",
                    }}>
                        Visão Geral
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: '13px',
                        fontWeight: 400,
                        color: 'var(--ios-label3, #8E8E93)',
                        marginTop: '4px',
                        letterSpacing: '-0.1px',
                    }}>
                        Desempenho financeiro consolidado
                    </p>

                    {/* MonthSelector abaixo do subtítulo */}
                    <div style={{ marginTop: '12px' }}>
                        <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                    </div>
                </div>

                {/* ── Seções de conteúdo estilo grouped iOS ────────────────────── */}
                <div className="px-4 pt-6 space-y-8">
                    {/* Saldo & Resumo */}
                    <section>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '10px',
                            paddingLeft: '4px',
                        }}>
                            Resumo do Mês
                        </h2>
                        <Wallet />
                    </section>

                    {/* Contas a Pagar */}
                    <section>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '10px',
                            paddingLeft: '4px',
                        }}>
                            Contas a Pagar
                        </h2>
                        <PayableAccounts />
                    </section>

                    {/* Fluxo Mensal */}
                    <section>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '10px',
                            paddingLeft: '4px',
                        }}>
                            Fluxo de Caixa
                        </h2>
                        <MonthlyEarningsChart currentDate={currentDate} />
                    </section>

                    {/* Transações */}
                    <section>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '10px',
                            paddingLeft: '4px',
                        }}>
                            Últimas Transações
                        </h2>
                        <TransactionsTable limit={10} />
                    </section>

                    {/* Insights */}
                    <section>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '10px',
                            paddingLeft: '4px',
                        }}>
                            Inteligência Financeira
                        </h2>
                        <DashboardInsights currentDate={currentDate} />
                    </section>

                    {/* Distribuição */}
                    <section>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '10px',
                            paddingLeft: '4px',
                        }}>
                            Distribuição
                        </h2>
                        <EarningsDonut currentDate={currentDate} />
                    </section>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6 max-w-[1440px] mx-auto pb-8 px-2 md:px-0">

            {/* Layout Principal Estático conforme Referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                {/* Coluna Mancha Esquerda (8/12 - 2 colunas no LG) */}
                <div className="lg:col-span-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Wallet />
                        <PayableAccounts />
                    </div>
                    <div className="w-full">
                        <MonthlyEarningsChart currentDate={currentDate} />
                    </div>
                </div>

                {/* Coluna Direita (4/12 - 1 coluna no LG) */}
                <div className="lg:col-span-4 h-full">
                    <TransactionsTable limit={10} />
                </div>
            </div>

            {/* Seção Inferior: Inteligência e Detalhes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 border-t border-border/50 pt-6">
                <div className="lg:col-span-8">
                    <DashboardInsights currentDate={currentDate} />
                </div>
                <div className="lg:col-span-4">
                    <EarningsDonut currentDate={currentDate} />
                </div>
            </div>
        </div>
    );
}
