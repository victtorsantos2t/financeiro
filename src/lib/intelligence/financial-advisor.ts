"use client";

import { Transaction } from "./forecasting";

export interface DashboardInsight {
    type: 'positive' | 'negative' | 'neutral';
    text: string;
    category?: string;
}

export interface Recommendation {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    impact: 'high' | 'medium' | 'low';
    icon: string;
}

export interface FinancialDiagnosis {
    score: number;
    status: 'Excelente' | 'Bom' | 'Alerta' | 'Crítico';
    diagnosis: string;
    benchmarks: {
        needs: number; // 50%
        wants: number; // 30%
        savings: number; // 20%
    };
    insights: DashboardInsight[];
    recommendations: Recommendation[];
}

/**
 * Advanced Financial Advisor Engine
 * Calculates benchmarks, generates insights and recommendations
 */
export function analyzeFinancialHealth(
    transactions: Transaction[],
    currentBalance: number,
    income: number,
    expense: number
): FinancialDiagnosis {
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // 1. Calculate Score & Status
    let score = 50;
    if (savingsRate > 20) score += 25;
    else if (savingsRate > 10) score += 15;
    else if (savingsRate > 0) score += 5;
    else score -= 20;

    const monthlyBurn = expense > 0 ? expense : 1;
    const runway = currentBalance / monthlyBurn;

    if (runway > 6) score += 25;
    else if (runway > 3) score += 15;
    else if (runway < 1) score -= 15;

    score = Math.min(100, Math.max(0, score));

    let status: FinancialDiagnosis['status'] = 'Alerta';
    if (score >= 85) status = 'Excelente';
    else if (score >= 65) status = 'Bom';
    else if (score < 40) status = 'Crítico';

    // 2. Automated Insights
    const insights: DashboardInsight[] = [];

    if (savingsRate > 20) {
        insights.push({ type: 'positive', text: "Sua taxa de poupança está acima da média de mercado (20%)." });
    } else if (savingsRate < 10 && savingsRate > 0) {
        insights.push({ type: 'neutral', text: "Sua margem de segurança está apertada. Considere reduzir custos variáveis." });
    } else if (savingsRate <= 0) {
        insights.push({ type: 'negative', text: "Atenção: Suas despesas superaram sua receita este mês." });
    }

    if (runway < 2) {
        insights.push({ type: 'negative', text: "Runway crítico: Você tem menos de 2 meses de sobrevivência sem renda." });
    }

    // 3. Simple Category Pattern Analysis (Mocking for now, could be expanded)
    const categoryTotals = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const desc = t.description?.toLowerCase() || "";
            // Simplified logic: mapping keywords to 50/30/20 buckets
            if (desc.includes('aluguel') || desc.includes('luz') || desc.includes('internet') || desc.includes('mercado')) {
                acc.needs += t.amount;
            } else if (desc.includes('ifood') || desc.includes('netflix') || desc.includes('lazer')) {
                acc.wants += t.amount;
            } else {
                acc.needs += t.amount; // default to needs for safety
            }
            return acc;
        }, { needs: 0, wants: 0 });

    const needsPerc = income > 0 ? (categoryTotals.needs / income) * 100 : 0;
    const wantsPerc = income > 0 ? (categoryTotals.wants / income) * 100 : 0;

    // 4. Recommendations
    const recommendations: Recommendation[] = [];

    if (wantsPerc > 30) {
        recommendations.push({
            id: 'cut-wants',
            title: 'Reduzir Desejos',
            description: `Seus gastos não-essenciais estão em ${wantsPerc.toFixed(1)}%. O ideal é 30%.`,
            actionLabel: 'Ver Gastos Lazer',
            impact: 'high',
            icon: 'TrendingDown'
        });
    }

    if (runway < 3) {
        recommendations.push({
            id: 'build-reserve',
            title: 'Reserva de Emergência',
            description: 'Sua reserva cobre menos de 3 meses. Foque em poupar 20% até atingir 6 meses.',
            actionLabel: 'Simular Reserva',
            impact: 'high',
            icon: 'ShieldAlert'
        });
    }

    if (savingsRate > 25) {
        recommendations.push({
            id: 'invest-surplus',
            title: 'Oportunidade de Investimento',
            description: 'Você tem um excedente saudável. Considere diversificar sua carteira.',
            actionLabel: 'Ver Opções',
            impact: 'medium',
            icon: 'PieChart'
        });
    }

    return {
        score,
        status,
        diagnosis: getDiagnosisMessage(score, status),
        benchmarks: {
            needs: Math.round(needsPerc),
            wants: Math.round(wantsPerc),
            savings: Math.round(savingsRate)
        },
        insights,
        recommendations
    };
}

function getDiagnosisMessage(score: number, status: string): string {
    if (score >= 85) return "Sua saúde financeira está em nível institucional. Você tem controle total e alta capacidade de investimento.";
    if (score >= 65) return "Bom desempenho. Você está no caminho certo, mas pequenos ajustes em gastos variáveis podem acelerar sua independência.";
    if (score >= 40) return "Sinal amarelo. Sua margem de manobra é limitada. É hora de auditar suas categorias de 'Desejos'.";
    return "Diagnóstico crítico. Suas despesas fixas ou recorrentes estão sufocando seu fluxo de caixa. Reestruturação imediata necessária.";
}
