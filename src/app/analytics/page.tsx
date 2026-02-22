"use client";

import { MonthlyEarningsChart } from "@/features/dashboard/monthly-earnings-chart";
import { EarningsDonut } from "@/features/dashboard/earnings-donut";
import { CashFlowForecast } from "@/features/dashboard/cash-flow-forecast";
import { FinancialHealthScorecard } from "@/features/dashboard/financial-health-scorecard";
import { RecommendationEngine } from "@/features/dashboard/recommendation-engine";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Wallet, BrainCircuit, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { IOSPageHeader } from "@/components/layout/ios-page-header";

export default function AnalyticsPage() {
    const [kpis, setKpis] = useState({
        averageIncome: 0,
        averageIncomeTheshold: 0,
        highestExpense: { amount: 0, name: "-" },
        currentSavings: 0,
        savingsPercentage: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchKPIData();
    }, []);

    const fetchKPIData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        const startCurrent = startOfMonth(today).toISOString();
        const endCurrent = endOfMonth(today).toISOString();
        const start3MonthsAgo = startOfMonth(subMonths(today, 3)).toISOString();

        const { data: currentMonthTx } = await supabase
            .from("transactions")
            .select("amount, type, description")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("date", startCurrent)
            .lte("date", endCurrent);

        const { data: historyTx } = await supabase
            .from("transactions")
            .select("amount, date")
            .eq("user_id", user.id)
            .eq("type", "income")
            .eq("status", "completed")
            .gte("date", start3MonthsAgo)
            .lte("date", endCurrent);

        if (currentMonthTx && historyTx) {
            const income = currentMonthTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const expense = currentMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
            const savings = income - expense;
            const savingsPerc = income > 0 ? (savings / income) * 100 : 0;

            const expenses = currentMonthTx.filter(t => t.type === 'expense');
            const highest = expenses.sort((a, b) => b.amount - a.amount)[0] || { amount: 0, description: "Nenhuma" };

            const totalHistoryIncome = historyTx.reduce((acc, t) => acc + t.amount, 0);
            const uniqueMonths = new Set(historyTx.map(t => t.date.substring(0, 7))).size || 1;
            const average = totalHistoryIncome / uniqueMonths;

            setKpis({
                averageIncome: average,
                averageIncomeTheshold: 0,
                highestExpense: { amount: highest.amount, name: highest.description },
                currentSavings: savings,
                savingsPercentage: savingsPerc
            });
        }
        setLoading(false);
    };

    return (
        <div className="space-y-12 pb-12">
            {/* iOS Large Title — Mobile Only */}
            <IOSPageHeader title="Análise" subtitle="Inteligência financeira em tempo real" />

            {/* Header Section — Desktop */}
            <div className="hidden md:flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 px-2 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                            Inteligência de Dados
                        </div>
                        <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Cérebro Financeiro</h1>
                    <p className="text-muted-foreground font-medium">Transformando dados em decisões estratégicas para seu futuro.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-11 px-6 gap-2 rounded-xl border-border text-muted-foreground hover:bg-secondary hover:text-foreground font-bold transition-all active:scale-95 shadow-sm">
                        <BrainCircuit className="h-4 w-4" />
                        Ajustar Metas
                    </Button>
                    <Button variant="outline" className="h-11 px-6 gap-2 rounded-xl border-border text-muted-foreground hover:bg-secondary hover:text-foreground font-bold transition-all active:scale-95 shadow-sm">
                        <Download className="h-4 w-4" />
                        Relatório IA
                    </Button>
                </div>
            </div>

            {/* FASE 1: Diagnóstico High-Level - KPIs de Inteligência */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-8 order-2 xl:order-1">
                    <CashFlowForecast />

                    {/* Compact KPI Row - Agora com mais destaque */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card p-6 rounded-card border border-border shadow-sm hover:shadow-md transition-all">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Média Mensal</p>
                            <p className="text-2xl font-bold text-foreground tracking-tight">
                                R$ {kpis.averageIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-card border border-border shadow-sm hover:shadow-md transition-all">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Maior Impacto</p>
                            <p className="text-2xl font-bold text-foreground tracking-tight text-destructive">
                                R$ {kpis.highestExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-card border border-border shadow-sm hover:shadow-md transition-all">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Economia Líquida</p>
                            <p className={cn(
                                "text-2xl font-bold tracking-tight",
                                kpis.currentSavings >= 0 ? "text-success" : "text-destructive"
                            )}>
                                R$ {kpis.currentSavings.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 h-full order-1 xl:order-2">
                    <div className="sticky top-24">
                        <FinancialHealthScorecard />
                    </div>
                </div>
            </div>

            {/* FASE 2: Recomendações & Estratégia */}
            <RecommendationEngine />

            {/* FASE 3: Detalhamento Visual */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8">
                    <MonthlyEarningsChart />
                </div>
                <div className="xl:col-span-4">
                    <EarningsDonut />
                </div>
            </div>
        </div >
    );
}

