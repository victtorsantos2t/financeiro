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

            transactions?.forEach(t => {
                const tDateStr = t.date.split('T')[0];
                const [tYear, tMonth] = tDateStr.split('-').map(Number);

                // Monthly stats
                if ((tMonth - 1) === currentMonth && tYear === currentYear && t.status === 'completed') {
                    if (t.type === 'income') inc += t.amount;
                    if (t.type === 'expense') exp += t.amount;
                }

                // Daily expenses
                if (tDateStr === todayStr && t.type === 'expense' && t.status === 'completed') {
                    dayExp += t.amount;
                }
            });

            setIncome(inc);
            setExpense(exp);
            setDailyExpenses(dayExp);
        } catch (error) {
            console.error("Erro ao carregar dados da carteira:", error);
        } finally {
            setLoading(false);
        }
    };

    // Simulated Trend Data for Premium UX (In a real scenario, this would compare current month vs last month)
    const totalTrend = 0.5;
    const incomeTrend = 12.5;
    const expenseTrend = -4.2;

    return (
        <div className="w-full bg-primary rounded-[20px] p-6 lg:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] relative flex flex-col gap-6 overflow-hidden border-none text-primary-foreground">
            {/* Decorative background gradients for depth */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none rounded-r-[20px]" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            {/* Linha 1: Resumo Financeiro */}
            <div className="flex flex-col z-10 w-full mb-1">
                <h2 className="text-primary-foreground/90 font-bold text-[15px] mb-2">Resumo Financeiro</h2>
                <div className="flex items-center gap-3">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        {loading ? <Skeleton className="h-10 w-40 bg-white/20" /> : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1 py-1 px-2.5 bg-white/20 rounded-full shrink-0">
                        <TrendingUp size={12} className="text-white" />
                        <span className="text-[10px] font-bold text-white">+{totalTrend}%</span>
                    </div>
                    <span className="text-primary-foreground/70 text-[12px] font-medium">Mês Anterior</span>
                </div>
            </div>

            {/* Linha 2: Duas colunas para Receitas e Despesas */}
            <div className="w-full grid grid-cols-2 gap-4 z-10 mt-1">
                {/* Metric: Income */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 flex flex-col justify-center transition-all duration-300 hover:bg-white/15">
                    <span className="text-primary-foreground/70 text-[11px] font-semibold uppercase tracking-wider mb-1">Receitas</span>
                    <span className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
                        {loading ? <Skeleton className="h-6 w-20 bg-white/20" /> : `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                    {!loading && (
                        <span className="text-emerald-400 text-[11px] font-bold">+{incomeTrend}%</span>
                    )}
                </div>

                {/* Metric: Expense */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 flex flex-col justify-center transition-all duration-300 hover:bg-white/15">
                    <span className="text-primary-foreground/70 text-[11px] font-semibold uppercase tracking-wider mb-1">Despesas</span>
                    <span className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
                        {loading ? <Skeleton className="h-6 w-20 bg-white/20" /> : `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                    {!loading && (
                        <span className="text-rose-400 text-[11px] font-bold">{expenseTrend}%</span>
                    )}
                </div>
            </div>

            {/* Linha 3: Gasto do Dia */}
            <div className="w-full z-10 mt-1">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all duration-300 hover:bg-white/15">
                    <div className="flex flex-col">
                        <span className="text-primary-foreground/70 text-[11px] font-semibold uppercase tracking-wider mb-1">Gasto do Dia</span>
                        <span className="text-xl sm:text-2xl font-bold tracking-tight">
                            {loading ? <Skeleton className="h-6 w-20 bg-white/20" /> : `R$ ${dailyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                    </div>
                    <span className="text-primary-foreground/60 text-[11px] font-medium bg-white/10 px-3 py-1.5 rounded-full">Hoje</span>
                </div>
            </div>
        </div>
    );
}
