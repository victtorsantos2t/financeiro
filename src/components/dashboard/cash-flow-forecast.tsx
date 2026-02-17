"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { calculateForecast, ForecastPoint } from "@/lib/intelligence/forecasting";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CashFlowForecast() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
    const supabase = createClient();

    useEffect(() => {
        fetchForecastData();
        const channel = supabase
            .channel('forecast_updates_v3')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchForecastData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchForecastData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: transactions } = await supabase
            .from("transactions")
            .select("amount, type, date, is_recurring, recurrence_interval")
            .eq("user_id", user.id)
            .eq("status", "completed");

        const { data: wallets } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", user.id);

        if (transactions && wallets) {
            const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
            const typedTransactions = transactions.map(t => ({
                amount: t.amount,
                type: t.type as "income" | "expense",
                date: t.date,
                is_recurring: t.is_recurring,
                recurrence_interval: t.recurrence_interval
            }));

            const baseForecast = calculateForecast(typedTransactions, totalBalance, 6);

            // Generate Risk Margins: Best Case (+5% income, -5% expense), Worst Case (-5% income, +5% expense)
            const enrichedData = baseForecast.map(point => {
                if (!point.isPrediction) return { ...point, bestCase: point.balance, worstCase: point.balance };

                const monthsOut = baseForecast.indexOf(point);
                const variance = 0.05 * monthsOut; // Increasing variance over time

                return {
                    ...point,
                    bestCase: Math.round(point.balance * (1 + variance)),
                    worstCase: Math.round(point.balance * (1 - variance))
                };
            });

            setData(enrichedData);

            // Deficit Risk Logic
            const lastPoint = enrichedData[enrichedData.length - 1];
            if (lastPoint.worstCase < 0) setRiskLevel('high');
            else if (lastPoint.balance < totalBalance * 0.5) setRiskLevel('medium');
            else setRiskLevel('low');
        }
        setLoading(false);
    };

    if (loading) return <Skeleton className="h-[350px] w-full rounded-[40px]" />;

    return (
        <div className="w-full bg-white rounded-[40px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/50 transition-all duration-700 relative overflow-hidden">
            <div className="mb-10 flex justify-between items-start relative z-10">
                <div>
                    <h3 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                        Projeção Preditiva <BrainCircuit className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fluxo de Caixa / 6 Meses</p>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <div className={cn(
                            "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider",
                            riskLevel === 'high' ? 'text-rose-600' : riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                        )}>
                            {riskLevel === 'high' ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                            Risco: {riskLevel === 'high' ? 'Alto' : riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </div>
                    </div>
                </div>
                <div className="px-5 py-2 rounded-2xl bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100/30 backdrop-blur-sm">
                    Cérebro Ativo
                </div>
            </div>

            <div className="h-[280px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#64748b" stopOpacity={0.05} />
                                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} horizontal={true} strokeDasharray="8 8" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            stroke="#cbd5e1"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={15}
                            tick={{ fill: '#94a3b8', fontWeight: 700 }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "24px",
                                border: "none",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                                backgroundColor: "rgba(255,255,255,0.95)",
                                backdropFilter: "blur(8px)",
                                padding: "16px 20px"
                            }}
                            cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '4 4' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const p = payload[0].payload;
                                    return (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.monthName}</p>
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-slate-900 tracking-tighter">
                                                    R$ {p.balance.toLocaleString('pt-BR')}
                                                </p>
                                                {p.isPrediction && (
                                                    <div className="space-y-1 pt-1 border-t border-slate-100">
                                                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter flex justify-between gap-4">
                                                            Pessimista: <span>R$ {p.worstCase.toLocaleString('pt-BR')}</span>
                                                        </p>
                                                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter flex justify-between gap-4">
                                                            Otimista: <span>R$ {p.bestCase.toLocaleString('pt-BR')}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Shaded Risk Area (Range) */}
                        <Area
                            type="monotone"
                            dataKey="bestCase"
                            stroke="none"
                            fill="#3b82f6"
                            fillOpacity={0.05}
                            connectNulls
                        />
                        <Area
                            type="monotone"
                            dataKey="worstCase"
                            stroke="none"
                            fill="#fff" // Cutout effect
                            fillOpacity={1}
                            connectNulls
                        />

                        {/* Real Connection Line */}
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#3b82f6"
                            strokeWidth={4}
                            fill="url(#colorBase)"
                            activeDot={{ r: 6, fill: "white", stroke: "#3b82f6", strokeWidth: 3 }}
                            connectNulls
                        />

                        {/* Reference Line for "Today" */}
                        <ReferenceLine
                            x={data.find(d => !d.isPrediction && data[data.indexOf(d) + 1]?.isPrediction)?.month}
                            stroke="#3b82f6"
                            strokeOpacity={0.2}
                            strokeWidth={2}
                            label={{ position: 'top', value: 'ATUAL', fill: '#3b82f6', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Warning Message if Risk is High */}
            {riskLevel === 'high' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3"
                >
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <p className="text-xs font-bold text-rose-700">
                        Cuidado: Sua reserva pode se esgotar em 4 meses se mantiver o padrão de gastos atual.
                    </p>
                </motion.div>
            )}
        </div>
    );
}

