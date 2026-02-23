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
            for (let i = 0; i < 12; i++) {
                monthlyMap.set(i, { income: 0, expense: 0 });
            }

            transactions.forEach(t => {
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

            const chartData = Array.from(monthlyMap.entries())
                .map(([monthIndex, values]) => ({
                    name: MONTHS[monthIndex],
                    income: values.income,
                    expense: values.expense
                }));

            setData(chartData);
        }
    };

    // Estilo customizado para o Tooltip estilo "Bubble Blue" da imagem de referência
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const income = payload.find((p: any) => p.dataKey === "income")?.value || 0;
            const expense = payload.find((p: any) => p.dataKey === "expense")?.value || 0;

            return (
                <div className="relative mb-4">
                    <div className="bg-primary text-white p-4 px-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 min-w-[180px]">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-2 border-b border-white/10 pb-1.5">Visão Mensal — {label}</p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[11px] font-medium opacity-90">Receitas:</span>
                                <span className="text-[14px] font-black">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[11px] font-medium opacity-90">Despesas:</span>
                                <span className="text-[14px] font-black">R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                    {/* Triângulo do balão */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-900/50 rounded-lg p-6 shadow-sm border border-[#E0E2E7] dark:border-white/5 hover:shadow-md transition-all duration-300">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">Fluxo de Caixa Mensal</h3>
                    <div className="flex items-center gap-6 text-[11px] font-bold">
                        <div className="flex items-center gap-2 text-[#7367F0]">
                            <span className="w-3 h-3 rounded-full bg-[#7367F0] shadow-sm shadow-[#7367F0]/40"></span>
                            Receitas
                        </div>
                        <div className="flex items-center gap-2 text-[#00CFE8]">
                            <span className="w-3 h-3 rounded-full bg-[#00CFE8] shadow-sm shadow-[#00CFE8]/40"></span>
                            Despesas
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-1.5 rounded-xl bg-secondary/50 text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-border/50">
                        Histórico {currentDate.getFullYear()}
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full mt-4">
                {data.length === 0 ? (
                    <Skeleton className="w-full h-full rounded-[32px]" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 40, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7367F0" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#7367F0" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00CFE8" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#00CFE8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                horizontal={true}
                                strokeDasharray="4 4"
                                stroke="var(--border)"
                                opacity={0.6}
                            />
                            <XAxis
                                dataKey="name"
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                tick={{ fill: 'var(--muted-foreground)', fontWeight: 600 }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: '#7367F0', strokeWidth: 2, strokeDasharray: '5 5' }}
                                offset={-40}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#7367F0"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                activeDot={{
                                    r: 6,
                                    fill: "white",
                                    stroke: "#7367F0",
                                    strokeWidth: 3,
                                    className: "shadow-xl"
                                }}
                                animationDuration={1500}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#00CFE8"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                activeDot={{
                                    r: 5,
                                    fill: "white",
                                    stroke: "#00CFE8",
                                    strokeWidth: 2,
                                }}
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
