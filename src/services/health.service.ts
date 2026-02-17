import { BaseService } from "./base.service";

export class FinancialHealthService extends BaseService {
    static async calculateScore() {
        const userId = await this.getUserId();

        // 1. Buscar dados necessários em paralelo
        const [transactions, wallets, goals] = await Promise.all([
            this.supabase.from("transactions").select("amount, type, status").eq("user_id", userId),
            this.supabase.from("wallets").select("balance").eq("user_id", userId),
            this.supabase.from("goals").select("current_amount, target_amount").eq("user_id", userId)
        ]);

        if (transactions.error || wallets.error || goals.error) return 0;

        // 2. Cálculos básicos
        const totalBalance = wallets.data.reduce((acc, w) => acc + w.balance, 0);
        const monthlyIncome = transactions.data
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        const monthlyExpenses = transactions.data
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        // 3. Pesos do Score
        let score = 0;

        // Savings Ratio (40 pts) - Ideal: guardar 20% ou mais
        const savingsRatio = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
        score += Math.min(Math.max(savingsRatio * 200, 0), 40);

        // Debt/Expense Control (30 pts)
        const expenseRatio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 1;
        score += Math.max(30 - (expenseRatio * 30), 0);

        // Goal Progress (30 pts)
        const totalGoalProgress = goals.data.length > 0
            ? goals.data.reduce((acc, g) => acc + (g.current_amount / g.target_amount), 0) / goals.data.length
            : 0.5; // Neutro se não tiver metas
        score += totalGoalProgress * 30;

        return Math.min(Math.ceil(score), 100);
    }
}
