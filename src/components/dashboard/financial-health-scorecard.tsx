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
        } catch (error) {
            console.error("Erro ao carregar métricas de saúde:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Skeleton className="h-[450px] w-full rounded-[40px]" />;

    return (
        <div className="bg-white rounded-[40px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/50 h-full flex flex-col relative overflow-hidden group transition-all duration-700">
            {/* Visual Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                <Target size={180} className="text-blue-600" />
            </div>

            {/* Header: Cockpit Style */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <Zap className="h-5 w-5" strokeWidth={3} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Diagnóstico</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn(
                                "h-1.5 w-1.5 rounded-full animate-pulse",
                                diagnosis?.status === 'Excelente' ? 'bg-emerald-500' :
                                    diagnosis?.status === 'Bom' ? 'bg-blue-500' : 'bg-orange-500'
                            )} />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IA Advisor v3.0</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={cn(
                        "text-sm font-bold",
                        diagnosis?.status === 'Excelente' ? 'text-emerald-600' :
                            diagnosis?.status === 'Bom' ? 'text-blue-600' : 'text-orange-600'
                    )}>{diagnosis?.status}</p>
                </div>
            </div>

            {/* Score Hero */}
            <div className="mb-10 text-center relative z-10">
                <div className="inline-flex items-center justify-center p-8 rounded-[48px] bg-slate-50 border border-slate-100/50 mb-4 shadow-inner">
                    <div className="text-center">
                        <p className="text-6xl font-black text-slate-900 tracking-tighter">{diagnosis?.score}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Score de Saúde</p>
                    </div>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-[280px] mx-auto">
                    {diagnosis?.diagnosis}
                </p>
            </div>

            {/* Benchmarks Section (50/30/20) */}
            <div className="space-y-6 mb-8 relative z-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Metas vs Realidade
                </p>

                <div className="space-y-4">
                    {/* Fixed Needs (50%) */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>ESSENCIAIS (META: 50%)</span>
                            <span>{diagnosis?.benchmarks.needs}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/30">
                            <div className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                (diagnosis?.benchmarks.needs || 0) <= 55 ? 'bg-blue-600' : 'bg-orange-500'
                            )} style={{ width: `${diagnosis?.benchmarks.needs}%` }} />
                        </div>
                    </div>

                    {/* Desires (30%) */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>DESEJOS (META: 30%)</span>
                            <span>{diagnosis?.benchmarks.wants}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/30">
                            <div className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                (diagnosis?.benchmarks.wants || 0) <= 35 ? 'bg-indigo-500' : 'bg-rose-500'
                            )} style={{ width: `${diagnosis?.benchmarks.wants}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Runway & Savings Footer */}
            <div className="mt-auto pt-6 border-t border-slate-50 grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Poupado</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{metrics?.savingsRate}%</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Runway</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                        {metrics?.runwayMonths} <span className="text-[10px] text-slate-400 uppercase tracking-normal">mês</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
