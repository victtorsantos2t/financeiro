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
            const balance = income - expense;

            return (
                <div className="relative mb-4 z-50">
                    <div className="bg-card border border-border text-foreground p-4 px-6 rounded-none shadow-none animate-in zoom-in-95 duration-200 min-w-[200px]">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 border-b border-border pb-1.5">Visão Mensal — {label}</p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Receitas:</span>
                                <span className="text-[14px] font-black text-[#00e676]">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Despesas:</span>
                                <span className="text-[14px] font-black text-destructive">R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 pt-1.5 mt-1.5 border-t border-border border-dashed">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Saldo Mês:</span>
                                <span className={`text-[14px] font-black ${balance >= 0 ? "text-[#00e676]" : "text-destructive"}`}>
                                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Triângulo do balão - Brutalist */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-b border-r border-border rotate-45" />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-card rounded-none p-6 shadow-none border border-border transition-all duration-300">
            <div className="mb-8 flex justify-between items-start border-b border-border pb-4">
                <div>
                    <h3 className="text-[13px] font-black uppercase tracking-[0.1em] text-foreground mb-2">Fluxo de Caixa Mensal</h3>
                    <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2 text-[#00e676]">
                            <span className="w-2 h-2 bg-[#00e676]"></span>
                            Receitas
                        </div>
                        <div className="flex items-center gap-2 text-destructive">
                            <span className="w-2 h-2 bg-destructive"></span>
                            Despesas
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-1.5 bg-secondary/50 text-muted-foreground text-[9px] font-black uppercase tracking-widest border border-border">
                        Histórico {currentDate.getFullYear()}
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full mt-4">
                {data.length === 0 ? (
                    <Skeleton className="w-full h-full rounded-none" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 40, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                tickFormatter={(value) => value.toUpperCase()}
                                tick={{ fill: 'var(--muted-foreground)', fontWeight: 900 }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: 'var(--border)', strokeWidth: 2, strokeDasharray: '5 5' }}
                                offset={-40}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#00e676"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                activeDot={{
                                    r: 6,
                                    fill: "var(--background)",
                                    stroke: "#00e676",
                                    strokeWidth: 2,
                                    className: "shadow-none"
                                }}
                                animationDuration={1500}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#ef4444"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                activeDot={{
                                    r: 5,
                                    fill: "var(--background)",
                                    stroke: "#ef4444",
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

// aria-label
