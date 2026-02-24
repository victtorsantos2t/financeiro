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
                <Skeleton className="col-span-1 md:col-span-2 h-64 rounded-none border-2 border-border bg-muted" />
                <Skeleton className="h-64 rounded-none border-2 border-border bg-muted" />
            </div>
        );
    }

    if (!transactions || transactions.length < 5) {
        return (
            <div className={cn("p-8 rounded-none border border-border bg-card shadow-none group transition-all duration-300 text-center", className)}>
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-foreground font-bold tracking-tight uppercase">Dados insuficientes para análise inteligente</h3>
                <p className="text-muted-foreground text-xs mt-1 tracking-wider uppercase">Continue registrando suas transações.</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000", className)}>
            {/* Anomalies & Report Grid - Central de Inteligência Residual */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Insights / Anomalies Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-none bg-card border border-border shadow-none transition-all duration-300">
                        <h4 className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-foreground mb-4">
                            <Sparkles className="w-4 h-4 text-primary" /> Alertas de Inteligência
                        </h4>

                        <div className="space-y-4">
                            {anomalies.length > 0 ? (
                                anomalies.map((anomaly, idx) => (
                                    <div key={idx} className="p-4 rounded-none bg-secondary/20 border border-border shadow-none animate-in zoom-in-95 fill-mode-both duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Gasto Atípico</span>
                                                <p className="text-sm font-black text-foreground mt-0.5 group-hover:text-primary transition-colors">Variação Elevada</p>
                                            </div>
                                            <div className={cn(
                                                "px-2 py-1 rounded-none border text-[9px] font-black uppercase tracking-widest",
                                                anomaly.nivel_de_risco === 'alto' ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            )}>
                                                {anomaly.nivel_de_risco === 'alto' ? 'Risco Alto' : 'Risco Médio'}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-muted-foreground" />
                                                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                    {categoryMap[anomaly.category] || 'Outros'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end font-black text-destructive text-xs gap-1">
                                                    +{anomaly.percentual_acima_media}% <ArrowUpRight className="w-3 h-3" />
                                                </div>
                                                <div className="text-[9px] text-muted-foreground font-black mt-1 uppercase tracking-widest">
                                                    R$ {anomaly.valor_atual.toLocaleString('pt-BR')} VS R$ {anomaly.valor_medio.toLocaleString('pt-BR')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center border border-dashed border-border rounded-none">
                                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Sem irregularidades.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top 5 Categorias Card */}
                    <div className="p-6 rounded-none bg-card border border-border shadow-none transition-all duration-300">
                        <h4 className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-foreground mb-6">
                            <TrendingDown className="w-4 h-4 text-primary" /> Top 5 Maiores Gastos
                        </h4>

                        <div className="space-y-4">
                            {topExpenses.map((expense, idx) => (
                                <div key={idx} className="flex items-center justify-between group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary transition-all duration-300 border border-primary/20">
                                            {idx + 1}
                                        </div>
                                        <span className="text-[11px] uppercase tracking-widest font-black text-muted-foreground group-hover:text-foreground transition-colors">
                                            {categoryMap[expense.category_id] || 'Outros'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-black text-foreground tabular-nums">
                                            R$ {expense.amount.toLocaleString('pt-BR')}
                                        </p>
                                        <div className="w-full h-1 bg-secondary mt-2 overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
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
                            "p-5 rounded-none border flex flex-col justify-between h-32 transition-all duration-300 shadow-none hover:border-primary relative overflow-hidden group",
                            analysis.previousMonthComparison >= 0
                                ? "bg-card border-border"
                                : "bg-destructive/5 border-destructive/20"
                        )}>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em]",
                                analysis.previousMonthComparison >= 0 ? "text-primary" : "text-destructive"
                            )}>
                                {analysis.previousMonthComparison >= 0 ? 'Crescimento' : 'Variação'}
                            </span>
                            <div className={cn(
                                "text-2xl font-black flex items-center gap-1",
                                analysis.previousMonthComparison >= 0 ? "text-foreground" : "text-destructive"
                            )}>
                                {Math.abs(analysis.growthPercentage).toFixed(1)}%
                            </div>

                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                                {analysis.previousMonthComparison >= 0 ? <TrendingUp className="w-20 h-20 text-primary" /> : <TrendingDown className="w-20 h-20 text-destructive" />}
                            </div>
                        </div>
                        <div className={cn(
                            "p-5 rounded-none border flex flex-col justify-between h-32 transition-all duration-300 shadow-none hover:border-primary relative overflow-hidden group",
                            analysis.monthlyBalance >= 0
                                ? "bg-card border-border"
                                : "bg-destructive/5 border-destructive/20"
                        )}>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em]",
                                analysis.monthlyBalance >= 0 ? "text-primary" : "text-destructive"
                            )}>
                                Balanço do Mês
                            </span>
                            <div className={cn(
                                "text-lg font-black truncate tabular-nums",
                                analysis.monthlyBalance >= 0 ? "text-foreground" : "text-destructive"
                            )}>
                                R$ {analysis.monthlyBalance.toLocaleString('pt-BR')}
                            </div>

                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                                <Activity className={cn("w-24 h-24", analysis.monthlyBalance >= 0 ? "text-primary" : "text-destructive")} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Detailed Report Column */}
                <div className="lg:col-span-2 p-6 rounded-none bg-card border border-border shadow-none transition-all duration-300 flex flex-col">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                        <h4 className="text-[13px] font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2">
                            <div className="w-2 h-6 bg-primary" />
                            Relatório Especial de Análise
                        </h4>
                        <div className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">GERADO EM {new Date().toLocaleDateString('pt-BR')}</div>
                    </div>

                    <div className="flex-1 space-y-8">
                        {/* Pontos Positivos */}
                        <section className="space-y-4">
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">✔ Conquistas do Mês</h5>
                            <ul className="space-y-3">
                                {report.pontosPositivos.map((point, i) => (
                                    <li key={i} className="flex items-start gap-3 group">
                                        <div className="mt-0.5 w-3 h-3 bg-secondary border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                                            <div className="w-1 h-1 bg-primary group-hover:bg-background" />
                                        </div>
                                        <span className="text-xs text-foreground uppercase tracking-wider font-bold leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Pontos de Atenção */}
                        {report.pontosAtencao.length > 0 && (
                            <section className="space-y-4">
                                <h5 className="text-[10px] font-black text-destructive uppercase tracking-[0.2em]">⚠ Pontos de Atenção</h5>
                                <ul className="space-y-3">
                                    {report.pontosAtencao.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3 group">
                                            <div className="mt-0.5 w-3 h-3 bg-destructive/10 border border-destructive flex items-center justify-center flex-shrink-0">
                                                <div className="w-1 h-1 bg-destructive" />
                                            </div>
                                            <span className="text-xs text-foreground uppercase tracking-wider font-bold leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Tendências & Próximos Passos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-border">
                            <section className="space-y-3">
                                <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Recomendações Profissionais
                                </h5>
                                {report.recomendacoes.map((rec, i) => (
                                    <div key={i} className="text-xs uppercase tracking-widest text-muted-foreground font-bold leading-relaxed bg-secondary/20 p-4 border border-border hover:border-primary transition-colors duration-300">
                                        {rec}
                                    </div>
                                ))}
                            </section>

                            <section className="space-y-3">
                                <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Tendências Detectadas
                                </h5>
                                {report.tendencias.map((trend, i) => (
                                    <p key={i} className="text-xs text-muted-foreground uppercase tracking-widest font-black leading-relaxed border-l-2 border-primary pl-4 py-1">
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

// aria-label
