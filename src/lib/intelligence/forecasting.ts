"use client";

import { addMonths, startOfMonth, format, isAfter, isBefore, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ForecastPoint {
    month: string;
    monthName: string;
    income: number;
    expense: number;
    balance: number;
    isPrediction: boolean;
}

export type Transaction = {
    amount: number;
    type: "income" | "expense";
    date: string;
    description?: string;
    is_recurring?: boolean;
    recurrence_interval?: string | null;
};

/**
 * Calculates a financial forecast for the next N months.
 * Factors in average historical spending and known recurring transactions.
 */
export function calculateForecast(
    transactions: Transaction[],
    initialBalance: number,
    monthsToForecast: number = 6
): ForecastPoint[] {
    const forecast: ForecastPoint[] = [];
    const today = new Date();

    // 1. Calculate Historical Averages (Last 3 months if available)
    const threeMonthsAgo = addMonths(today, -3);
    const recentTransactions = transactions.filter(t =>
        isAfter(new Date(t.date), threeMonthsAgo) && isBefore(new Date(t.date), today)
    );

    const avgMonthlyIncome = recentTransactions
        .filter(t => t.type === 'income' && !t.is_recurring)
        .reduce((acc, t) => acc + t.amount, 0) / 3;

    const avgMonthlyExpense = recentTransactions
        .filter(t => t.type === 'expense' && !t.is_recurring)
        .reduce((acc, t) => acc + t.amount, 0) / 3;

    // 2. Identify Recurring Transactions
    const recurringIncome = transactions
        .filter(t => t.type === 'income' && t.is_recurring)
        .reduce((acc, t) => acc + t.amount, 0);

    const recurringExpense = transactions
        .filter(t => t.type === 'expense' && t.is_recurring)
        .reduce((acc, t) => acc + t.amount, 0);

    // 3. Project Future Months
    let runningBalance = initialBalance;

    for (let i = 0; i <= monthsToForecast; i++) {
        const projectionDate = addMonths(startOfMonth(today), i);
        const monthKey = format(projectionDate, "MMM yy", { locale: ptBR });
        const monthFullName = format(projectionDate, "MMMM", { locale: ptBR });

        const projectedIncome = recurringIncome + (avgMonthlyIncome || 0);
        const projectedExpense = recurringExpense + (avgMonthlyExpense || 0);

        // Update balance for this projected month
        if (i > 0) {
            runningBalance += (projectedIncome - projectedExpense);
        }

        forecast.push({
            month: monthKey,
            monthName: monthFullName,
            income: Math.round(projectedIncome),
            expense: Math.round(projectedExpense),
            balance: Math.round(runningBalance),
            isPrediction: i > 0
        });
    }

    return forecast;
}

export function calculateHealthMetrics(transactions: Transaction[], currentBalance: number) {
    const today = new Date();
    const last30Days = transactions.filter(t =>
        isAfter(new Date(t.date), addMonths(today, -1))
    );

    const income = last30Days.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = last30Days.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const monthlyBurn = expense > 0 ? expense : 1; // avoid div by zero
    const runwayMonths = currentBalance / monthlyBurn;

    return {
        savingsRate: Math.max(0, Math.round(savingsRate)),
        monthlyBurn: Math.round(monthlyBurn),
        runwayMonths: runwayMonths > 24 ? "24+" : Math.round(runwayMonths * 10) / 10,
        healthScore: calculateScore(savingsRate, runwayMonths)
    };
}

function calculateScore(savingsRate: number, runway: number): number {
    // Basic scorecard logic (0-100)
    let score = 50;

    // Savings rate impact
    if (savingsRate > 20) score += 20;
    else if (savingsRate > 0) score += 10;
    else score -= 10;

    // Runway impact
    if (runway > 6) score += 30;
    else if (runway > 3) score += 15;
    else if (runway < 1) score -= 20;

    return Math.min(100, Math.max(0, score));
}
