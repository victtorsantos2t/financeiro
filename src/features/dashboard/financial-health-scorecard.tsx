"use client";

import { createClient } from "@/lib/supabase/client";
import { services } from "@/core/application/services/services.factory";
import { FinancialDiagnosis } from "@/lib/intelligence/financial-advisor";
import { useEffect, useState } from "react";
import { Activity, Zap, TrendingUp, Calendar, Heart, ShieldCheck, Target, Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function FinancialHealthScorecard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [diagnosis, setDiagnosis] = useState<FinancialDiagnosis | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchMetrics();
        const channel = supabase
            .channel('health_metrics_v3')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchMetrics())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const healthData: any = await services.health.calculateHealthScore();

            const mockMetrics = { savingsRate: Math.ceil(healthData.score / 2), runwayMonths: Math.floor(healthData.score / 10) };
            const diagnosisData: FinancialDiagnosis = {
                score: healthData.score,
                status: healthData.diagnosis as any,
                diagnosis: healthData.insights.join(' ') || "Análise concluída.",
                benchmarks: { needs: 50, wants: 30, savings: 20 },
                insights: healthData.insights.map((s: string) => ({
                    type: 'neutral',
                    text: s
                })),
                recommendations: healthData.recommendations.map((s: string, i: number) => ({
                    id: `rec-${i}`,
                    title: "Recomendação",
                    description: s,
                    actionLabel: 'Ver detalhes',
                    impact: 'medium',
                    icon: 'Zap'
                }))
            };

            setMetrics(mockMetrics);
            setDiagnosis(diagnosisData);
        } catch (error: any) {
            // Ignora AbortError natural do modo estrito do React ou navegação
            if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
                return;
            }
            console.error("Erro ao carregar métricas de saúde:", error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Skeleton className="h-[450px] w-full rounded-none border-2 border-border shadow-none" />;

    return (
        <div className="bg-card rounded-none p-6 shadow-none border-2 border-border h-full flex flex-col relative overflow-hidden group transition-all duration-300">
            {/* Visual Decoration - Sustile Icons */}
            <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none">
                <Target size={120} className="text-primary" />
            </div>

            {/* Header: Cockpit Style */}
            <div className="flex items-center justify-between mb-6 relative z-10 border-b-2 border-border pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-foreground text-background border-2 border-transparent">
                        <Zap className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div>
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground">Diagnóstico</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn(
                                "h-2 w-2 rounded-none",
                                diagnosis?.status === 'Excelente' ? 'bg-success' :
                                    diagnosis?.status === 'Bom' ? 'bg-primary' : 'bg-destructive'
                            )} />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">IA Advisor</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Status</p>
                    <p className={cn(
                        "text-[12px] font-black uppercase tracking-widest",
                        diagnosis?.status === 'Excelente' ? 'text-success' :
                            diagnosis?.status === 'Bom' ? 'text-primary' : 'text-destructive'
                    )}>{diagnosis?.status}</p>
                </div>
            </div>

            {/* Score Hero */}
            <div className="mb-8 text-center relative z-10 flex flex-col items-center">
                <div className="inline-flex items-center justify-center p-6 rounded-none bg-background border-2 border-border mb-3 min-w-[140px]">
                    <div className="text-center">
                        <p className="text-5xl font-black text-foreground tracking-tighter">{diagnosis?.score}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Score</p>
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto text-center">
                    {diagnosis?.diagnosis}
                </p>
            </div>

            {/* Benchmarks Section (50/30/20) */}
            <div className="space-y-6 mb-8 relative z-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3 w-3 stroke-[3]" /> Metas de Gastos
                </p>

                <div className="space-y-5">
                    {/* Fixed Needs (50%) */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <span>ESSENCIAIS (META: 50%)</span>
                            <span>{diagnosis?.benchmarks.needs}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary border border-border rounded-none overflow-hidden">
                            <div className={cn(
                                "h-full rounded-none transition-all duration-1000",
                                (diagnosis?.benchmarks.needs || 0) <= 55 ? 'bg-primary' : 'bg-destructive'
                            )} style={{ width: `${diagnosis?.benchmarks.needs}%` }} />
                        </div>
                    </div>

                    {/* Desires (30%) */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <span>DESEJOS (META: 30%)</span>
                            <span>{diagnosis?.benchmarks.wants}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary border border-border rounded-none overflow-hidden">
                            <div className={cn(
                                "h-full rounded-none transition-all duration-1000",
                                (diagnosis?.benchmarks.wants || 0) <= 35 ? 'bg-indigo-500' : 'bg-destructive'
                            )} style={{ width: `${diagnosis?.benchmarks.wants}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Runway & Savings Footer */}
            <div className="mt-auto pt-5 border-t-2 border-border grid grid-cols-2 gap-4 relative z-10">
                <div className="p-3.5 bg-background rounded-none border-2 border-border text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Poupado</p>
                    <p className="text-2xl font-black text-foreground tracking-tighter">{metrics?.savingsRate}%</p>
                </div>
                <div className="p-3.5 bg-background rounded-none border-2 border-border text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Runway</p>
                    <p className="text-2xl font-black text-foreground tracking-tighter">
                        {metrics?.runwayMonths} <span className="text-[10px] text-muted-foreground uppercase tracking-widest">meses</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

// aria-label
