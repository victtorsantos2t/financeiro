"use client";

import { createClient } from "@/lib/supabase/client";
import { services } from "@/core/application/services/services.factory";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function Wallet() {
    const [totalBalance, setTotalBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [loading, setLoading] = useState(true);
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
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [wallets, transactions] = await Promise.all([
                services.wallets.getUserWallets(),
                services.transactions.getHistory()
            ]);

            const total = wallets?.reduce((acc, curr) => acc + curr.balance, 0) || 0;
            setTotalBalance(total);

            // Filter for current month completed transactions
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            let inc = 0;
            let exp = 0;

            transactions?.forEach(t => {
                const tDate = new Date(t.date);
                if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear && t.status === 'completed') {
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
        <div className="w-full h-auto min-h-[224px] bg-white rounded-[24px] p-8 flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-100/40 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_8px_40px_-4px_rgba(0,0,0,0.04)]">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-slate-400 font-semibold text-[10px] uppercase tracking-[0.15em] mb-2.5">Saldo Total</h3>
                    <h2 className="text-5xl font-semibold text-slate-900 tracking-[-0.05em]">
                        {loading ? <Skeleton className="h-10 w-48" /> : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </h2>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <TrendingUp className="w-5 h-5 text-slate-900/60" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 mt-8">
                <div className="p-5 rounded-[20px] bg-slate-50/40 border border-slate-100/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em]">Receita</p>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-xl font-semibold text-slate-900 tracking-tight">
                            {loading ? <Skeleton className="h-6 w-24" /> : `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-[20px] bg-slate-50/40 border border-slate-100/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em]">Despesa</p>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-xl font-semibold text-slate-900 tracking-tight">
                            {loading ? <Skeleton className="h-6 w-24" /> : `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Premium Mesh Gradient - Refined Saturaion */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-gradient-to-br from-blue-500/[0.04] to-purple-500/[0.04] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-gradient-to-tr from-emerald-500/[0.04] to-teal-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}
