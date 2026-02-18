import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyEarningsChartProps {
    currentDate?: Date;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function MonthlyEarningsChart({ currentDate = new Date() }: MonthlyEarningsChartProps) {
    const [data, setData] = useState<{ name: string; income: number; expense: number }[]>([]);
    const supabase = createClient();

    useEffect(() => {
        fetchChartData();

        // Realtime subscription
        const channel = supabase
            .channel('realtime_earnings_chart')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                },
                () => {
                    fetchChartData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentDate]);

    const fetchChartData = async () => {
        const year = currentDate.getFullYear();
        const startOfYear = new Date(year, 0, 1).toISOString();
        const endOfYear = new Date(year, 11, 31).toISOString();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch ALL completed transactions for the year
        const { data: transactions } = await supabase
            .from("transactions")
            .select("date, amount, type")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("date", startOfYear)
            .lte("date", endOfYear)
            .order("date");

        if (transactions) {
            const monthlyMap = new Map<number, { income: number; expense: number }>();

            // Initialize all months
            for (let i = 0; i < 12; i++) {
                monthlyMap.set(i, { income: 0, expense: 0 });
            }

            // Aggregate data
            transactions.forEach(t => {
                // Use UTC month to correspond with ISO date storage
                const date = new Date(t.date);
                const month = date.getUTCMonth();
                const current = monthlyMap.get(month) || { income: 0, expense: 0 };

                if (t.type === 'income') {
                    current.income += t.amount;
                } else if (t.type === 'expense') {
                    current.expense += t.amount;
                }

                monthlyMap.set(month, current);
            });

            const currentMonthIndex = new Date().getMonth();

            // Format for chart
            const chartData = Array.from(monthlyMap.entries())
                .map(([monthIndex, values]) => ({
                    name: MONTHS[monthIndex],
                    income: values.income,
                    expense: values.expense
                }));

            setData(chartData);
        }
    };

    return (
        <div className="w-full bg-white rounded-[24px] p-8 md:p-10 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.02)] border border-slate-100/40 transition-all duration-700">
            <div className="mb-10 flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1.5">Visão Mensal</h3>
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold">
                        <div className="flex items-center gap-1.5 text-emerald-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Receita
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-500">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Despesa
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-5 py-2 rounded-2xl bg-slate-50/50 text-slate-400 text-[10px] font-semibold uppercase tracking-widest border border-slate-100/30">
                        {currentDate.getFullYear()}
                    </div>
                </div>
            </div>

            <div className="h-[260px] w-full">
                {data.length === 0 ? (
                    <Skeleton className="w-full h-full rounded-[24px]" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                horizontal={true}
                                strokeDasharray="10 10"
                                stroke="#f8fafc"
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#cbd5e1"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                tick={{ fill: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "20px",
                                    border: "1px solid rgba(255,255,255,0.8)",
                                    boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
                                    backgroundColor: "rgba(255,255,255,0.85)",
                                    backdropFilter: "blur(16px)",
                                    fontWeight: "600",
                                    fontSize: "12px",
                                    padding: "16px 20px"
                                }}
                                cursor={{ stroke: '#e2e8f0', strokeWidth: 1.5 }}
                                formatter={(value: any, name: any) => [
                                    `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                    name === 'income' ? 'Receita' : 'Despesa'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#10b981" // Emerald-500
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                activeDot={{
                                    r: 6,
                                    fill: "white",
                                    stroke: "#10b981",
                                    strokeWidth: 3,
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#f43f5e" // Rose-500
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                activeDot={{
                                    r: 6,
                                    fill: "white",
                                    stroke: "#f43f5e",
                                    strokeWidth: 3,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
