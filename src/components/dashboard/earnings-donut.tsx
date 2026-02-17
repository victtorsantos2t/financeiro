"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#f8fafc"]; // Vibrant Primary and soft backdrop

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
        <div className="w-full bg-white rounded-[24px] p-8 md:p-10 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.02)] border border-slate-100/40 flex flex-col items-center justify-between transition-all duration-700">
            <h3 className="text-2xl font-semibold text-slate-900 w-full text-left mb-8 tracking-tight">Balanço</h3>

            <div className="h-[280px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={85}
                            outerRadius={110}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={16}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--chart-1)' : 'var(--secondary)'} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '20px',
                                border: "1px solid rgba(255,255,255,0.8)",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
                                backgroundColor: "rgba(255,255,255,0.85)",
                                backdropFilter: "blur(16px)",
                                padding: '12px 18px',
                                fontSize: '12px',
                                fontWeight: 700
                            }}
                            itemStyle={{ color: '#1e293b' }}
                            cursor={false}
                            formatter={(value: number | undefined) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, ""]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                    <span className="text-4xl font-semibold text-slate-900 tracking-tighter">
                        R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.3em] mt-3 ml-1">Receitas</span>
                </div>
            </div>

            <div className="flex gap-10 mt-10">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-blue-500/80 rounded-full shadow-lg shadow-blue-500/10"></div>
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.15em]">Receitas</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-slate-100 rounded-full"></div>
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.15em]">Despesas</span>
                </div>
            </div>
        </div>
    );
}
