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
        <div className="flex flex-col gap-4 w-full">
            {/* Main Balance Card */}
            <div className="w-full bg-white dark:bg-zinc-900/50 rounded-lg p-6 shadow-sm border border-[#E0E2E7] dark:border-white/5 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        {/* Circular Progress Indicator - Reduced size */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="32%"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                    fill="transparent"
                                    className="text-zinc-100 dark:text-zinc-800"
                                />
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="32%"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                    fill="transparent"
                                    strokeDasharray="100"
                                    strokeDashoffset="25"
                                    strokeLinecap="round"
                                    className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Coins size={16} className="sm:w-5 sm:h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-0.5">
                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Saldo Total</span>
                            <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight whitespace-nowrap">
                                {loading ? <Skeleton className="h-8 w-28" /> : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </div>
                        </div>
                    </div>

                    {/* Total Trend info */}
                    <div className="hidden lg:flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">Mês anterior</span>
                        <div className="flex items-center gap-1 py-1 px-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
                            <TrendingUp size={10} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+{totalTrend}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Income Card */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-4 shadow-sm border border-[#E0E2E7] dark:border-white/5 transition-all duration-300 hover:shadow-md active:scale-[0.98] group">
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Receita</span>
                    <div className="flex flex-col gap-1">
                        <span className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tighter whitespace-nowrap">
                            {loading ? <Skeleton className="h-6 w-16" /> : `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                        </span>
                        {!loading && (
                            <div className="flex items-center gap-1 py-0.5 px-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg w-fit">
                                <ArrowUpRight size={10} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+{incomeTrend}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expense Card */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-4 shadow-sm border border-[#E0E2E7] dark:border-white/5 transition-all duration-300 hover:shadow-md active:scale-[0.98] group">
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Despesa</span>
                    <div className="flex flex-col gap-1">
                        <span className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tighter whitespace-nowrap">
                            {loading ? <Skeleton className="h-6 w-16" /> : `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                        </span>
                        {!loading && (
                            <div className="flex items-center gap-1 py-0.5 px-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg w-fit">
                                <ArrowDownRight size={10} className="text-rose-500" />
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{expenseTrend}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Daily Expense Card */}
            <div className="flex-1 bg-white dark:bg-zinc-900/50 rounded-lg p-5 shadow-sm border border-[#E0E2E7] dark:border-white/5 relative overflow-hidden group hover:shadow-md transition-all duration-300 min-h-[110px]">
                <div className="flex flex-col justify-between h-full relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-500 shadow-sm border border-rose-100/50 dark:border-rose-500/20">
                            <TrendingDown size={14} />
                        </div>
                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Gasto do Dia</span>
                    </div>

                    <div className="space-y-0.5">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            {loading ? <Skeleton className="h-8 w-32" /> : `R$ ${dailyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </div>
                        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                            Total de despesas confirmadas hoje
                        </p>
                    </div>
                </div>

                {/* Decorative background icon */}
                <TrendingDown size={80} className="absolute -right-4 -bottom-4 text-zinc-100/50 dark:text-white/5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            </div>
        </div>
    );
}
