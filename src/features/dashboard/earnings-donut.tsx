"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#7367F0", "#F1F1F1"]; // Purple and soft zinc

interface EarningsDonutProps {
    currentDate?: Date;
}

export function EarningsDonut({ currentDate = new Date() }: EarningsDonutProps) {
    const [data, setData] = useState([
        { name: "Receitas", value: 0 },
        { name: "Despesas", value: 0 },
    ]);
    const supabase = createClient();

    useEffect(() => {
        fetchData();

        // Realtime subscription
        const channel = supabase
            .channel('realtime_earnings_donut')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentDate]);

    const fetchData = async () => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: transactions } = await supabase
            .from("transactions")
            .select("amount, type")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("date", startOfMonth)
            .lte("date", endOfMonth);

        if (transactions) {
            const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

            setData([
                { name: "Receitas", value: income },
                { name: "Despesas", value: expense },
            ]);
        }
    };

    const totalIncome = data.find(d => d.name === "Receitas")?.value || 0;

    return (
        <div className="w-full bg-white dark:bg-[#2C2C2E] rounded-lg p-6 shadow-sm hover:shadow-md border border-[#E0E2E7] dark:border-white/5 flex flex-col items-center justify-between transition-all duration-300">
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-white w-full text-left mb-6">Balanço do Mês</h3>

            <div className="h-[240px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={75}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={8}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : 'var(--secondary)'} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: "1px solid var(--border)",
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                backgroundColor: "var(--card)",
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: 600
                            }}
                            itemStyle={{ color: 'var(--foreground)' }}
                            cursor={false}
                            formatter={(value: number | undefined) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, ""]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                    <span className="text-3xl font-bold text-foreground tracking-tight">
                        R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Receitas</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 justify-center">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Receitas</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                    <div className="w-2.5 h-2.5 bg-secondary rounded-full"></div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Despesas</span>
                </div>
            </div>
        </div>
    );
}
