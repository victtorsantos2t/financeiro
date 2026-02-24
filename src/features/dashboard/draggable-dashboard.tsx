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
import { BudgetAlerts } from "@/features/dashboard/budget-alerts";

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

    // Geração automática de transações recorrentes pendentes
    useEffect(() => {
        const processRecurring = async () => {
            const supabase = createClient();
            try {
                const { data, error } = await supabase.rpc('process_recurring_transactions');
                if (error) console.error("Error processing recurring:", error);
                else if (data?.generated > 0) {
                    console.log(`[Recorrência] ${data.generated} transação(ões) gerada(s) automaticamente.`);
                }
            } catch (err) {
                console.error("Failed to process recurring:", err);
            }
        };
        processRecurring();
    }, []);

    if (!mounted) return <div className="p-8 text-center text-slate-400">Carregando Dashboard...</div>;

    const renderWidget = (id: string) => {
        switch (id) {
            case 'smart-insights': return <DashboardInsights currentDate={currentDate} />;
            case 'wallet-summary': return <Wallet />;
            case 'transactions-table': return <TransactionsTable />;
            case 'monthly-chart': return <MonthlyEarningsChart currentDate={currentDate} />;
            case 'earnings-donut': return <EarningsDonut currentDate={currentDate} />;
            case 'payable-accounts': return <PayableAccounts selectedDate={currentDate} />;
            default: return null;
        }
    };

    // Versão Mobile — iOS Native
    if (isMobile) {
        return (
            <div
                className="w-full pb-[40px]"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif" }}
            >
                {/* ── Mobile Strict Header Header ───────────────────────────── */}
                <div
                    className="sticky top-0 z-40 px-4 pt-[22px] pb-3 border-b-2 border-primary transition-colors duration-300 bg-background"
                >
                    {/* Header Row for Title and potentially other items */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 style={{
                                fontSize: '24px',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                letterSpacing: '-0.5px',
                                color: 'var(--foreground)',
                                fontFamily: "inherit",
                                textTransform: 'uppercase'
                            }}>
                                Terminal
                            </h1>

                            {/* Subtitle */}
                            <p style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: 'var(--muted-foreground)',
                                marginTop: '2px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase'
                            }}>
                                Visão Consolidada
                            </p>
                        </div>

                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }} className="border-t border-border pt-3">
                        <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                    </div>
                </div>

                {/* ── Seções de conteúdo estilo grouped iOS ────────────────────── */}
                <div className="px-4 pt-4 space-y-5">
                    <BudgetAlerts />

                    {/* Saldo & Resumo */}
                    <section>
                        <h2 style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--muted-foreground)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '6px',
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
                            fontWeight: 700,
                            color: 'var(--muted-foreground)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '6px',
                            paddingLeft: '4px',
                        }}>
                            Contas a Pagar
                        </h2>
                        <PayableAccounts selectedDate={currentDate} />
                    </section>
                    {/* Fluxo Mensal */}
                    <section>
                        <h2 style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '6px',
                            paddingLeft: '4px',
                        }}>
                            Fluxo de Caixa
                        </h2>
                        <MonthlyEarningsChart currentDate={currentDate} />
                    </section>

                    {/* Transações */}
                    <section>
                        <h2 style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '6px',
                            paddingLeft: '4px',
                        }}>
                            Últimas Transações
                        </h2>
                        <TransactionsTable limit={10} />
                    </section>

                    {/* Insights */}
                    <section>
                        <h2 style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '6px',
                            paddingLeft: '4px',
                        }}>
                            Inteligência Financeira
                        </h2>
                        <DashboardInsights currentDate={currentDate} />
                    </section>

                    {/* Distribuição */}
                    <section>
                        <h2 style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--ios-label3, #8E8E93)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '6px',
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
        <div className="w-full max-w-[1600px] mx-auto pb-12 px-2 md:px-0">
            {/* Header / Titulo Brutalist Desktop */}
            <div className="hidden md:flex flex-col border-b-2 border-primary pb-6 mb-8 mt-4 uppercase">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-primary">Painel de Operações</h1>
                <p className="text-xs font-bold text-muted-foreground tracking-[0.2em] mt-1">Terminal Financeiro de Alta Precisão</p>
            </div>

            {/* Continuous Stream Layout (100% Stacked & Asymmetric Tension) */}
            <div className="flex flex-col gap-6 w-full">

                <BudgetAlerts />

                {/* Layer 1: Financial Vital Signs */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(400px,max-content)] gap-6 items-stretch">
                    <Wallet />
                    <PayableAccounts selectedDate={currentDate} />
                </div>

                {/* Layer 2: Massive Chart Stream */}
                <div className="w-full border-t border-b border-border py-6 bg-card">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Volume de Fluxo de Caixa</h2>
                    </div>
                    <MonthlyEarningsChart currentDate={currentDate} />
                </div>

                {/* Layer 3: Asymmetric Split (70/30) Tension */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 border-t border-border pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Livro-Razão & Insights</h2>
                        </div>
                        <DashboardInsights currentDate={currentDate} />
                        <div className="mt-4">
                            <TransactionsTable limit={10} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 border-l border-border pl-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Composição</h2>
                        </div>
                        <EarningsDonut currentDate={currentDate} />
                    </div>
                </div>

            </div>
        </div>
    );
}

// aria-label
