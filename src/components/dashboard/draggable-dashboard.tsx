"use client";

import { useState, useEffect } from "react";
import { useWidgetStore } from "@/core/application/store/widget-store";

// Widgets atuais transformados em componentes mapeáveis
import { Wallet } from "@/components/dashboard/wallet";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { MonthlyEarningsChart } from "@/components/dashboard/monthly-earnings-chart";
import { EarningsDonut } from "@/components/dashboard/earnings-donut";
import { useDashboard } from "@/context/dashboard-context";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { ImportTransactionsModal } from "@/components/dashboard/import-transactions-modal";
import { PayableAccounts } from "@/components/dashboard/payable-accounts";
import { createClient } from "@/lib/supabase/client";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";

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

    // Versão Mobile
    if (isMobile) {
        return (
            <div className="space-y-8 max-w-[1440px] mx-auto pb-32 px-5 pt-4">
                <div className="flex flex-col gap-0 px-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Visão Geral</h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Insights da sua conta</p>
                </div>

                <div className="flex items-center justify-center p-3 py-4 bg-white/50 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-sm">
                    <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />
                </div>

                <div className="flex flex-col gap-8">
                    <Wallet />
                    <PayableAccounts />
                    <MonthlyEarningsChart currentDate={currentDate} />
                    <TransactionsTable />
                    <DashboardInsights currentDate={currentDate} />
                    <EarningsDonut currentDate={currentDate} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1440px] mx-auto pb-8 px-2 md:px-0">
            {/* Header com Ações */}
            <div className="flex flex-col gap-1 md:flex-row md:items-end justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
                    <p className="text-xs font-medium text-slate-400 tracking-wide">Desempenho financeiro consolidado.</p>
                </div>
                <div className="hidden md:flex gap-3">
                    <ImportTransactionsModal />
                    <AddTransactionModal />
                </div>
            </div>

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
                    <TransactionsTable />
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
