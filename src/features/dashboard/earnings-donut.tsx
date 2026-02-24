"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#00e676", "var(--border)"];

interface EarningsDonutProps {
    currentDate?: Date;
}

export function EarningsDonut({ currentDate = new Date() }: EarningsDonutProps) {
    const [data, setData] = useState([
        { name: "Receitas", value: 0 },
        { name: "Despesas", value: 1 }, // Initialize with 1 to avoid empty chart visually if needed, data fetching handles it
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
        <div className="w-full bg-card rounded-none p-6 shadow-none border border-border flex flex-col items-center justify-between transition-all duration-300">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground w-full text-left border-b border-border pb-2 mb-6">Composição</h3>

            <div className="h-[240px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={75}
                            outerRadius={95}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="var(--card)"
                            strokeWidth={2}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={0}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#00e676' : 'var(--muted)'} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '0px',
                                border: "1px solid var(--border)",
                                boxShadow: "none",
                                backgroundColor: "var(--card)",
                                padding: '8px 12px',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                fontWeight: 900
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
                    <div className="w-2.5 h-2.5 bg-[#00e676]"></div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Receitas</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                    <div className="w-2.5 h-2.5 bg-muted"></div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Despesas</span>
                </div>
            </div>
        </div>
    );
}

// aria-label
