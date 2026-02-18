import { Transaction } from "@/core/domain/entities/finance";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export interface CashFlowAnalysis {
    totalIncome: number;
    totalExpense: number;
    monthlyBalance: number;
    previousMonthComparison: number;
    growthPercentage: number;
}

export interface CategoryAnomaly {
    category: string;
    percentual_acima_media: number;
    valor_atual: number;
    valor_medio: number;
    nivel_de_risco: 'baixo' | 'médio' | 'alto';
}

export interface CategoryExpense {
    category_id: string;
    amount: number;
}

export interface NextMonthProjection {
    saldo_projetado: number;
    risco_de_deficit: boolean;
    confianca_percentual: number;
}

export interface FinancialHealthScore {
    score: number;
    classificacao: string;
    recomendacoes: string[];
}

export interface MonthlyReport {
    pontosPositivos: string[];
    pontosAtencao: string[];
    tendencias: string[];
    recomendacoes: string[];
}

/**
 * 1) Calcula análise de fluxo de caixa baseada no mês atual vs anterior
 */
export function calculateCashFlowAnalysis(transactions: Transaction[], referenceDate: Date = new Date()): CashFlowAnalysis {
    const now = referenceDate;
    const currentMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const prevMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

    const getTotals = (start: Date, end: Date) => {
        return transactions
            .filter(t => {
                const d = parseISO(t.date);
                return isWithinInterval(d, { start, end });
            })
            .reduce((acc, t) => {
                if (t.type === 'income') acc.income += t.amount;
                else acc.expense += t.amount;
                return acc;
            }, { income: 0, expense: 0 });
    };

    const current = getTotals(currentMonth.start, currentMonth.end);
    const previous = getTotals(prevMonth.start, prevMonth.end);

    const currentBalance = current.income - current.expense;
    const previousBalance = previous.income - previous.expense;

    const comparison = currentBalance - previousBalance;
    const growth = previousBalance !== 0 ? (comparison / Math.abs(previousBalance)) * 100 : 0;

    return {
        totalIncome: current.income,
        totalExpense: current.expense,
        monthlyBalance: currentBalance,
        previousMonthComparison: comparison,
        growthPercentage: growth
    };
}

/**
 * 2) Detecta anomalias de gastos por categoria
 * Regra: gasto_categoria > média últimos 3 meses * 1.25
 */
export function detectCategoryAnomalies(transactions: Transaction[], referenceDate: Date = new Date()): CategoryAnomaly[] {
    const now = referenceDate;
    const currentMonthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
    const last3MonthsInterval = { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(subMonths(now, 1)) };

    const categories = Array.from(new Set(transactions.map(t => t.category_id)));
    const anomalies: CategoryAnomaly[] = [];

    categories.forEach(catId => {
        const catTransactions = transactions.filter(t => t.category_id === catId && t.type === 'expense');

        const currentSpend = catTransactions
            .filter(t => isWithinInterval(parseISO(t.date), currentMonthInterval))
            .reduce((sum, t) => sum + t.amount, 0);

        const pastSpend = catTransactions
            .filter(t => isWithinInterval(parseISO(t.date), last3MonthsInterval))
            .reduce((sum, t) => sum + t.amount, 0);

        const pastMonthsWithData = new Set(
            catTransactions
                .filter(t => isWithinInterval(parseISO(t.date), last3MonthsInterval))
                .map(t => startOfMonth(parseISO(t.date)).toISOString())
        ).size;

        const effectiveDivisor = Math.max(pastMonthsWithData, 1);
        const avgPastSpend = pastSpend / effectiveDivisor;

        if (avgPastSpend > 0 && currentSpend > avgPastSpend * 1.25) {
            const diffPct = ((currentSpend / avgPastSpend) - 1) * 100;
            anomalies.push({
                category: catId,
                percentual_acima_media: Math.round(diffPct),
                valor_atual: currentSpend,
                valor_medio: avgPastSpend,
                nivel_de_risco: diffPct > 50 ? 'alto' : 'médio'
            });
        }
    });

    return anomalies;
}

/**
 * 3.1) Calcula o Top 5 categorias com mais gastos no mês de referência
 */
export function calculateTopExpenses(transactions: Transaction[], referenceDate: Date = new Date()): CategoryExpense[] {
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);

    const categoryTotals: Record<string, number> = {};

    transactions
        .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start, end }))
        .forEach(t => {
            categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + t.amount;
        });

    return Object.entries(categoryTotals)
        .map(([id, amount]) => ({ category_id: id, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
}

/**
 * 3) Projeta o saldo do próximo mês baseado em tendência linear simples
 */
export function projectNextMonthBalance(transactions: Transaction[], referenceDate: Date = new Date()): NextMonthProjection {
    const now = referenceDate;
    const balances: number[] = [];

    for (let i = 3; i >= 1; i--) {
        const start = startOfMonth(subMonths(now, i));
        const end = endOfMonth(subMonths(now, i));
        const monthTx = transactions.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
        const inc = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const exp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        balances.push(inc - exp);
    }

    const avgBalance = balances.length > 0 ? balances.reduce((a, b) => a + b, 0) / balances.length : 0;
    const trend = balances.length > 1 ? (balances[balances.length - 1] - balances[0]) / (balances.length - 1) : 0;

    // Projeção conservadora
    const projection = avgBalance + (trend * 0.5);

    return {
        saldo_projetado: Math.round(projection),
        risco_de_deficit: projection < 0,
        confianca_percentual: balances.every(b => b > 0) ? 85 : 60
    };
}

/**
 * 4) Calcula Score de Saúde Financeira (0-100)
 */
export function calculateFinancialHealthScore(transactions: Transaction[], referenceDate: Date = new Date()): FinancialHealthScore {
    const analysis = calculateCashFlowAnalysis(transactions, referenceDate);

    // a) Taxa de economia (40%) - Excelente se > 30%
    const savingsRate = analysis.totalIncome > 0 ? (analysis.monthlyBalance / analysis.totalIncome) : 0;
    const savingsScore = Math.min(Math.max((savingsRate / 0.3) * 100, 0), 100) * 0.4;

    // b) Estabilidade (25%) - Simplificado: saldo positivo no mês
    const stabilityScore = (analysis.monthlyBalance > 0 ? 100 : 0) * 0.25;

    // c) Crescimento (25%) - Clamp em 100 para evitar distorção
    const growthScore = Math.min(Math.max(analysis.growthPercentage, 0), 100) * 0.25;

    // d) Controle (10%) - Penaliza se houver anomalias altas
    const anomalies = detectCategoryAnomalies(transactions, referenceDate);
    const controlScore = (anomalies.some(a => a.nivel_de_risco === 'alto') ? 50 : 100) * 0.1;

    const totalScore = Math.round(savingsScore + stabilityScore + growthScore + controlScore);

    let rank = "Bronze";
    let recs = ["Tente poupar pelo menos 20% da sua renda."];

    if (totalScore >= 80) {
        rank = "Diamante";
        recs = ["Excelente gestão! Considere investir o excedente.", "Mantenha o controle rigoroso de categorias."];
    } else if (totalScore >= 60) {
        rank = "Ouro";
        recs = ["Bom controle. Tente reduzir gastos variáveis em 10%.", "Sua reserva de emergência está crescendo."];
    } else if (totalScore >= 40) {
        rank = "Prata";
        recs = ["Atenção ao fluxo de caixa.", "Revise seus gastos fixos do mês."];
    }

    return {
        score: totalScore,
        classificacao: rank,
        recomendacoes: recs
    };
}

/**
 * 5) Gera Relatório Mensal Estruturado
 */
export function generateMonthlyReport(transactions: Transaction[], referenceDate: Date = new Date(), categoryNames: Record<string, string> = {}): MonthlyReport {
    const analysis = calculateCashFlowAnalysis(transactions, referenceDate);
    const health = calculateFinancialHealthScore(transactions, referenceDate);
    const anomalies = detectCategoryAnomalies(transactions, referenceDate);
    const projection = projectNextMonthBalance(transactions, referenceDate);

    const report: MonthlyReport = {
        pontosPositivos: [],
        pontosAtencao: [],
        tendencias: [],
        recomendacoes: health.recomendacoes
    };

    if (analysis.monthlyBalance > 0) {
        report.pontosPositivos.push(`Saldo positivo de R$ ${analysis.monthlyBalance.toLocaleString('pt-BR')}.`);
    } else {
        report.pontosAtencao.push("O fechamento do mês está negativo.");
    }

    if (analysis.growthPercentage !== 0) {
        const isPositive = analysis.previousMonthComparison > 0;
        const growthValue = Math.abs(analysis.growthPercentage);
        const growthText = growthValue > 100
            ? `Variação expressiva (acima de 100%) em relação ao mês anterior`
            : `${isPositive ? 'Crescimento' : 'Redução'} de ${growthValue.toFixed(1)}% em relação ao mês anterior`;

        if (isPositive) {
            report.pontosPositivos.push(growthText + ".");
        } else {
            report.pontosAtencao.push(growthText + ".");
        }
    }

    anomalies.forEach(a => {
        const catName = categoryNames[a.category] || a.category;
        report.pontosAtencao.push(`Gasto atípico em ${catName} (${a.percentual_acima_media}% acima da média).`);
    });

    report.tendencias.push(`Projeção de R$ ${projection.saldo_projetado.toLocaleString('pt-BR')} para o próximo período.`);

    if (projection.risco_de_deficit) {
        report.tendencias.push("Alerta: Risco de déficit projetado.");
    }

    return report;
}
