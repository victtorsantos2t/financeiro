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
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[200px] w-full rounded-none border-2 border-border bg-muted shadow-none" />)}
        </div>
    );

    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b-2 border-border pb-4">
                <div className="p-3 bg-foreground text-background border-2 border-transparent">
                    <Lightbulb className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                    <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground">Estratégias Recomendadas</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ações baseadas em seu padrão de consumo</p>
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
                                className="group bg-card p-6 rounded-none border-2 border-border shadow-none hover:border-primary/50 transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn(
                                        "p-4 rounded-none border-2",
                                        rec.impact === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-primary/10 text-primary border-primary/30'
                                    )}>
                                        <Icon className="h-6 w-6 stroke-[2.5]" />
                                    </div>
                                    {rec.impact === 'high' && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive border-2 border-destructive/30 rounded-none">
                                            <Flame className="h-3 w-3 stroke-[3]" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Alto Impacto</span>
                                        </div>
                                    )}
                                </div>

                                <h4 className="text-[12px] font-black uppercase tracking-widest text-foreground mb-2 group-hover:text-primary transition-colors">
                                    {rec.title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed mb-6 flex-1">
                                    {rec.description}
                                </p>

                                <Button
                                    className="w-full h-[42px] rounded-none bg-foreground hover:bg-foreground/90 text-background font-black text-[10px] uppercase tracking-widest gap-2 group/btn transition-all active:scale-95 border-2 border-foreground shadow-none"
                                >
                                    {rec.actionLabel}
                                    <ArrowRight className="h-4 w-4 stroke-[3] group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

// aria-label
