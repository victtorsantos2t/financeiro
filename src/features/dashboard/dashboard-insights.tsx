"use client";

import React, { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Activity,
    Target,
    CheckCircle2,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Trophy,
    ShieldCheck
} from 'lucide-react';
import {
    calculateCashFlowAnalysis,
    detectCategoryAnomalies,
    projectNextMonthBalance,
    calculateFinancialHealthScore,
    generateMonthlyReport,
    calculateTopExpenses,
    CategoryExpense
} from '@/utils/financialAnalysis';
import { Transaction } from '@/core/domain/entities/finance';
import { cn } from '@/lib/utils';
import { services } from '@/core/application/services/services.factory';
import { Skeleton } from '@/components/ui/skeleton';

// TransactionWithDetails is now redundant as Transaction domain entity has been updated

interface DashboardInsightsProps {
    className?: string;
    currentDate?: Date;
}

export function DashboardInsights({ className, currentDate = new Date() }: DashboardInsightsProps) {
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Buscamos o histórico total para permitir comparações temporais nas funções puras
                const data = await services.transactions.getHistory();
                setTransactions(data);
            } catch (error) {
                // Erro silencioso
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 1) Processamento de dados via useMemo (Funções Puras)
    const analysis = useMemo(() => calculateCashFlowAnalysis(transactions, currentDate), [transactions, currentDate]);
    const anomalies = useMemo(() => detectCategoryAnomalies(transactions, currentDate), [transactions, currentDate]);
    const projection = useMemo(() => projectNextMonthBalance(transactions, currentDate), [transactions, currentDate]);
    const health = useMemo(() => calculateFinancialHealthScore(transactions, currentDate), [transactions, currentDate]);
    // Mapeamento de IDs para Nomes para garantir que sempre exibimos o nome se ele existir em algum lugar do histórico
    const categoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        transactions.forEach(t => {
            if (t.category_id && t.category?.name) {
                map[t.category_id] = t.category.name;
            }
        });
        return map;
    }, [transactions]);

    const report = useMemo(() => generateMonthlyReport(transactions, currentDate, categoryMap), [transactions, currentDate, categoryMap]);
    const topExpenses = useMemo(() => calculateTopExpenses(transactions, currentDate), [transactions, currentDate]);

    if (loading) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
                <Skeleton className="col-span-1 md:col-span-2 h-64 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
            </div>
        );
    }

    if (!transactions || transactions.length < 5) {
        return (
            <div className={cn("p-8 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E0E2E7] dark:border-white/5 shadow-sm group hover:shadow-md transition-all duration-300 text-center", className)}>
                <Activity className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-slate-500 dark:text-slate-400 font-medium">Dados insuficientes para análise inteligente</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Continue registrando suas transações para desbloquear insights.</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000", className)}>
            {/* Anomalies & Report Grid - Central de Inteligência Residual */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Insights / Anomalies Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E0E2E7] dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                        <h4 className="flex items-center gap-2 text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-4">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Alertas de Inteligência
                        </h4>

                        <div className="space-y-4">
                            {anomalies.length > 0 ? (
                                anomalies.map((anomaly, idx) => (
                                    <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 shadow-none animate-in zoom-in-95 fill-mode-both duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Gasto Atípico</span>
                                                <p className="text-sm font-bold text-slate-900 mt-0.5 group-hover:text-amber-600 transition-colors">Variação Elevada</p>
                                            </div>
                                            <div className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                                                anomaly.nivel_de_risco === 'alto' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                                {anomaly.nivel_de_risco === 'alto' ? 'Risco Alto' : 'Risco Médio'}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                    {categoryMap[anomaly.category] || 'Outros'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end font-bold text-rose-500 dark:text-rose-400 text-xs gap-1">
                                                    +{anomaly.percentual_acima_media}% <ArrowUpRight className="w-3 h-3" />
                                                </div>
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                                                    R$ {anomaly.valor_atual.toLocaleString('pt-BR')} vs Méd. R$ {anomaly.valor_medio.toLocaleString('pt-BR')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs text-slate-400 font-medium italic">Sem irregularidades detectadas neste mês.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top 5 Categorias Card */}
                    <div className="p-6 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E0E2E7] dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                        <h4 className="flex items-center gap-2 text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-6">
                            <TrendingDown className="w-4 h-4 text-[#7367F0]" /> Top 5 Maiores Gastos
                        </h4>

                        <div className="space-y-4">
                            {topExpenses.map((expense, idx) => (
                                <div key={idx} className="flex items-center justify-between group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-[#7367F0]/10 flex items-center justify-center text-[13px] font-bold text-[#7367F0] group-hover:bg-[#7367F0] group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm border border-[#7367F0]/20">
                                            {idx + 1}
                                        </div>
                                        <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            {categoryMap[expense.category_id] || 'Outros'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                                            R$ {expense.amount.toLocaleString('pt-BR')}
                                        </p>
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-[#7367F0] rounded-full transition-all duration-1000"
                                                style={{ width: `${(expense.amount / topExpenses[0].amount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={cn(
                            "p-5 rounded-lg border flex flex-col justify-between h-32 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 relative overflow-hidden group",
                            analysis.previousMonthComparison >= 0
                                ? "bg-white dark:bg-[#2C2C2E] border-[#E0E2E7] dark:border-white/5"
                                : "bg-rose-50/50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
                        )}>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                analysis.previousMonthComparison >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                                {analysis.previousMonthComparison >= 0 ? 'Crescimento' : 'Variação'}
                            </span>
                            <div className={cn(
                                "text-2xl font-bold flex items-center gap-1",
                                analysis.previousMonthComparison >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                            )}>
                                {Math.abs(analysis.growthPercentage).toFixed(1)}%
                            </div>

                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                                {analysis.previousMonthComparison >= 0 ? <TrendingUp className="w-20 h-20 text-emerald-500" /> : <TrendingDown className="w-20 h-20 text-rose-500" />}
                            </div>
                        </div>
                        <div className={cn(
                            "p-5 rounded-lg border flex flex-col justify-between h-32 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 relative overflow-hidden group",
                            analysis.monthlyBalance >= 0
                                ? "bg-white dark:bg-[#2C2C2E] border-[#E0E2E7] dark:border-white/5"
                                : "bg-rose-50/50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
                        )}>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                analysis.monthlyBalance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                                Balanço do Mês
                            </span>
                            <div className={cn(
                                "text-lg font-bold truncate",
                                analysis.monthlyBalance >= 0 ? "text-indigo-700 dark:text-indigo-300" : "text-rose-700 dark:text-rose-300"
                            )}>
                                R$ {analysis.monthlyBalance.toLocaleString('pt-BR')}
                            </div>

                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                                <Activity className={cn("w-24 h-24", analysis.monthlyBalance >= 0 ? "text-indigo-500" : "text-rose-500")} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Detailed Report Column */}
                <div className="lg:col-span-2 p-6 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E0E2E7] dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
                        <h4 className="text-[17px] font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-slate-900 dark:bg-white rounded-full" />
                            Relatório Especial de Análise
                        </h4>
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">GERADO EM {new Date().toLocaleDateString('pt-BR')}</div>
                    </div>

                    <div className="flex-1 space-y-8">
                        {/* Pontos Positivos */}
                        <section className="space-y-4">
                            <h5 className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">✔ Conquistas do Mês</h5>
                            <ul className="space-y-3">
                                {report.pontosPositivos.map((point, i) => (
                                    <li key={i} className="flex items-start gap-3 group">
                                        <div className="mt-1 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 group-hover:bg-white" />
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Pontos de Atenção */}
                        {report.pontosAtencao.length > 0 && (
                            <section className="space-y-4">
                                <h5 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em]">⚠ Pontos de Atenção</h5>
                                <ul className="space-y-3">
                                    {report.pontosAtencao.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3 group">
                                            <div className="mt-1 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Tendências & Próximos Passos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                            <section className="space-y-3">
                                <h5 className="text-xs font-bold text-[#7367F0] uppercase tracking-widest flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Recomendações Profissionais
                                </h5>
                                {report.recomendacoes.map((rec, i) => (
                                    <div key={i} className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-white/5 p-3 rounded-md border border-slate-100 dark:border-white/5 hover:border-[#7367F0]/30 transition-colors duration-300">
                                        {rec}
                                    </div>
                                ))}
                            </section>

                            <section className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Tendências Detectadas
                                </h5>
                                {report.tendencias.map((trend, i) => (
                                    <p key={i} className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                                        {trend}
                                    </p>
                                ))}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
