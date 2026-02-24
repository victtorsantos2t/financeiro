"use client";

import { createClient } from "@/lib/supabase/client";
import { services } from "@/core/application/services/services.factory";
import { TrendingDown, TrendingUp, Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/context/dashboard-context";
import { cn } from "@/lib/utils";

export function Wallet() {
    const [totalBalance, setTotalBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [dailyExpenses, setDailyExpenses] = useState(0);

    // Trend states
    const [totalTrend, setTotalTrend] = useState(0);
    const [incomeTrend, setIncomeTrend] = useState(0);
    const [expenseTrend, setExpenseTrend] = useState(0);

    const [loading, setLoading] = useState(true);
    const { refreshTrigger, currentDate } = useDashboard();
    const supabase = createClient();

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('realtime_wallet_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => fetchData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wallets' },
                () => fetchData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshTrigger, currentDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [wallets, transactions] = await Promise.all([
                services.wallets.getUserWallets(),
                services.transactions.getHistory()
            ]);

            const total = wallets?.reduce((acc, curr) => acc + curr.balance, 0) || 0;
            setTotalBalance(total);

            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            let inc = 0;
            let exp = 0;
            let dayExp = 0;

            let lastMonthInc = 0;
            let lastMonthExp = 0;

            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            transactions?.forEach(t => {
                const tDateStr = t.date.split('T')[0];
                const [tYear, tMonth] = tDateStr.split('-').map(Number);
                const isCompleted = t.status === 'completed';

                if (isCompleted) {
                    // Current Month stats
                    if ((tMonth - 1) === currentMonth && tYear === currentYear) {
                        if (t.type === 'income') inc += t.amount;
                        if (t.type === 'expense') exp += t.amount;
                    }

                    // Last Month stats
                    if ((tMonth - 1) === prevMonth && tYear === prevYear) {
                        if (t.type === 'income') lastMonthInc += t.amount;
                        if (t.type === 'expense') lastMonthExp += t.amount;
                    }

                    // Daily expenses
                    if (tDateStr === todayStr && t.type === 'expense') {
                        dayExp += t.amount;
                    }
                }
            });

            setIncome(inc);
            setExpense(exp);
            setDailyExpenses(dayExp);

            // Calculate Real Trends
            const incTrendVal = lastMonthInc > 0 ? ((inc - lastMonthInc) / lastMonthInc) * 100 : (inc > 0 ? 100 : 0);
            const expTrendVal = lastMonthExp > 0 ? ((exp - lastMonthExp) / lastMonthExp) * 100 : (exp > 0 ? 100 : 0);

            const lastMonthNetWorth = total - (inc - exp);
            const netTrendVal = lastMonthNetWorth !== 0 && lastMonthNetWorth > 0 ? ((inc - exp) / lastMonthNetWorth) * 100 : 0;

            setIncomeTrend(incTrendVal);
            setExpenseTrend(expTrendVal);
            setTotalTrend(netTrendVal);

        } catch (error) {
            console.error("Erro ao carregar dados da carteira:", error);
        } finally {
            setLoading(false);
        }
    };

    // Removed simulated trends

    return (
        <div className="w-full bg-primary border bg-card text-card-foreground rounded-none p-6 lg:p-8 shadow-none relative flex flex-col gap-6 overflow-hidden transition-all group">

            {/* Linha 1: Resumo Financeiro */}
            <div className="flex flex-col z-10 w-full mb-1">
                <h2 className="text-primary-foreground/70 dark:text-muted-foreground font-bold text-xs tracking-widest uppercase mb-3">Patrimônio Líquido</h2>
                <div className="flex items-center gap-3">
                    <span className="text-4xl sm:text-6xl font-black tracking-tighter text-primary-foreground">
                        {loading ? <Skeleton className="h-10 w-40 bg-white/20" /> : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <div className={cn(
                        "flex items-center justify-center px-2 py-0.5 font-bold text-[11px] rounded-none shrink-0 uppercase tracking-widest",
                        totalTrend >= 0 ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"
                    )}>
                        {totalTrend > 0 ? '+' : ''}{totalTrend.toFixed(1)}% {totalTrend >= 0 ? <TrendingUp size={11} className="ml-1" /> : <TrendingDown size={11} className="ml-1" />}
                    </div>
                    <span className="text-primary-foreground/50 text-xs font-medium uppercase tracking-wider">vs Mês Anterior</span>
                </div>
            </div>

            {/* Linha 2: Duas colunas - Sharp borders */}
            <div className="w-full grid grid-cols-2 gap-[1px] bg-border/[0.08] p-[1px] mt-2">
                {/* Metric: Income */}
                <div className="bg-primary/95 p-5 flex flex-col justify-center transition-all duration-300">
                    <span className="text-primary-foreground/50 text-[10px] font-black uppercase tracking-[0.1em] mb-2">Entradas Realizadas</span>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary-foreground mb-1">
                        {loading ? <Skeleton className="h-6 w-20 bg-white/20" /> : `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                    {!loading && (
                        <span className={cn(
                            "text-[11px] font-bold",
                            incomeTrend >= 0 ? "text-accent" : "text-rose-500"
                        )}>
                            {incomeTrend > 0 ? '↑' : '↓'} {Math.abs(incomeTrend).toFixed(1)}%
                        </span>
                    )}
                </div>

                {/* Metric: Expense */}
                <div className="bg-primary/95 p-5 flex flex-col justify-center transition-all duration-300">
                    <span className="text-primary-foreground/50 text-[10px] font-black uppercase tracking-[0.1em] mb-2">Saídas Registradas</span>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary-foreground mb-1">
                        {loading ? <Skeleton className="h-6 w-20 bg-white/20" /> : `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                    {!loading && (
                        <span className={cn(
                            "text-[11px] font-bold",
                            expenseTrend > 0 ? "text-rose-500" : "text-accent" // More expense is bad (red), less is good (green)
                        )}>
                            {expenseTrend > 0 ? '↑' : '↓'} {Math.abs(expenseTrend).toFixed(1)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Linha 3: Gasto do Dia */}
            <div className="w-full z-10 mt-2">
                <div className="bg-transparent border border-primary-foreground/10 p-4 sm:p-5 flex items-center justify-between transition-all duration-300 hover:border-primary-foreground/30">
                    <div className="flex flex-col">
                        <span className="text-primary-foreground/50 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Consumo do Dia</span>
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground">
                            {loading ? <Skeleton className="h-6 w-20 bg-white/20" /> : `R$ ${dailyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                    </div>
                    <span className="text-primary-foreground text-[10px] font-bold border border-primary-foreground/20 px-3 py-1 uppercase tracking-widest">
                        HOJE
                    </span>
                </div>
            </div>
        </div>
    );
}

// aria-label
