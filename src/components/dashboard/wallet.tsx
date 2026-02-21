"use client";

import { createClient } from "@/lib/supabase/client";
import { services } from "@/core/application/services/services.factory";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/context/dashboard-context";

export function Wallet() {
    const [totalBalance, setTotalBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [loading, setLoading] = useState(true);
    const { refreshTrigger, currentDate } = useDashboard();
    const supabase = createClient();

    useEffect(() => {
        fetchData();

        // Realtime subscription for both transactions and wallets
        const channel = supabase
            .channel('realtime_wallet_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                },
                () => fetchData()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wallets',
                },
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

            // Filter for current month completed transactions based on selected date
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            let inc = 0;
            let exp = 0;

            transactions?.forEach(t => {
                // Fix timezone issue by splitting explicitly
                const [tYear, tMonth] = t.date.split('T')[0].split('-').map(Number);
                // tMonth is 1-indexed, getMonth() is 0-indexed

                if ((tMonth - 1) === currentMonth && tYear === currentYear && t.status === 'completed') {
                    if (t.type === 'income') inc += t.amount;
                    if (t.type === 'expense') exp += t.amount;
                }
            });

            setIncome(inc);
            setExpense(exp);
        } catch (error) {
            console.error("Erro ao carregar dados da carteira:", error);
        } finally {
            setLoading(false);
        }
    };

    // Simulated Trend Data for Premium UX Feedback
    // In a real scenario, this would compare current month vs last month
    const incomeTrend = 12.5;
    const expenseTrend = -4.2;

    return (
        <div className="w-full h-auto min-h-[180px] bg-card rounded-card p-5 flex flex-col justify-between shadow-sm border border-border relative overflow-hidden group transition-all duration-300 hover:shadow-md">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-muted-foreground font-medium text-[12px] mb-1">Saldo Total</h3>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">
                        {loading ? <Skeleton className="h-8 w-40" /> : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </h2>
                </div>
                <div className="p-2.5 bg-secondary rounded-xl text-primary">
                    <TrendingUp className="w-4 h-4" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 mt-4">
                <div className="p-3.5 rounded-[20px] bg-white dark:bg-[#2C2C2E] border border-border dark:border-white/5 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.2 h-1.2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <p className="text-[9px] font-black text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Receita</p>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white tracking-tighter">
                            {loading ? <Skeleton className="h-5 w-20" /> : `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                        </span>
                    </div>
                </div>

                <div className="p-3.5 rounded-[20px] bg-white dark:bg-[#2C2C2E] border border-border dark:border-white/5 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.2 h-1.2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        <p className="text-[9px] font-black text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Despesa</p>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white tracking-tighter">
                            {loading ? <Skeleton className="h-5 w-20" /> : `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Subtle Gradient Hint */}
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        </div>
    );
}
