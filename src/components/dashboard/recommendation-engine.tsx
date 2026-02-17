"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { analyzeFinancialHealth, Recommendation } from "@/lib/intelligence/financial-advisor";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingDown,
    ShieldAlert,
    PieChart,
    ArrowRight,
    Flame,
    Lightbulb,
    Zap,
    TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, any> = {
    TrendingDown,
    ShieldAlert,
    PieChart,
    Zap,
    TrendingUp
};

export function RecommendationEngine() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchRecommendations();
        const channel = supabase
            .channel('recommendations_v1')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchRecommendations())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchRecommendations = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: transactions } = await supabase
            .from("transactions")
            .select("amount, type, date, is_recurring, description")
            .eq("user_id", user.id)
            .eq("status", "completed");

        const { data: wallets } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", user.id);

        if (transactions && wallets) {
            const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const currentMonthIncome = transactions
                .filter(t => t.type === 'income' && t.date >= start)
                .reduce((acc, t) => acc + t.amount, 0);
            const currentMonthExpense = transactions
                .filter(t => t.type === 'expense' && t.date >= start)
                .reduce((acc, t) => acc + t.amount, 0);

            const advisorResults = analyzeFinancialHealth(transactions, totalBalance, currentMonthIncome, currentMonthExpense);
            setRecommendations(advisorResults.recommendations);
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[200px] w-full rounded-[32px]" />)}
        </div>
    );

    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Estratégias Recomendadas</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ações baseadas em seu padrão de consumo</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {recommendations.map((rec, index) => {
                        const Icon = ICON_MAP[rec.icon] || Lightbulb;
                        return (
                            <motion.div
                                key={rec.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn(
                                        "p-4 rounded-2xl",
                                        rec.impact === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    {rec.impact === 'high' && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full">
                                            <Flame className="h-3 w-3" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Alto Impacto</span>
                                        </div>
                                    )}
                                </div>

                                <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                                    {rec.title}
                                </h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 flex-1">
                                    {rec.description}
                                </p>

                                <Button
                                    className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs gap-2 group/btn transition-all active:scale-95"
                                >
                                    {rec.actionLabel}
                                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
