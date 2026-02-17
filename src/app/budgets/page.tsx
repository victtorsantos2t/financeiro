"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

type CategoryBudget = {
    categoryId: string;
    categoryName: string;
    spent: number;
    budget: number;
    budgetId?: string;
};

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // 1. Get Expense Categories
            const { data: categories } = await supabase
                .from("categories")
                .select("id, name")
                .eq("user_id", user.id)
                .eq("type", "expense");

            if (!categories) {
                setLoading(false);
                return;
            }

            // 2. Get Budgets for Current Month
            const { data: existingBudgets } = await supabase
                .from("budgets")
                .select("id, category_id, amount")
                .eq("user_id", user.id)
                .eq("month_year", currentMonthYear);

            // 3. Get Transactions for Current Month
            const startOfMonth = `${currentMonthYear}-01`;
            // Fix: Use date-fns to get the actual last day of the month
            const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString();

            const { data: transactions } = await supabase
                .from("transactions")
                .select("category_id, amount")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .gte("date", startOfMonth)
                .lte("date", endOfMonth);

            // 4. Combine Data
            const combinedData: CategoryBudget[] = categories.map(cat => {
                const budgetObj = existingBudgets?.find(b => b.category_id === cat.id);
                const spent = transactions
                    ?.filter(t => t.category_id === cat.id)
                    .reduce((acc, curr) => acc + curr.amount, 0) || 0;

                return {
                    categoryId: cat.id,
                    categoryName: cat.name,
                    spent,
                    budget: budgetObj?.amount || 0,
                    budgetId: budgetObj?.id
                };
            });

            setBudgets(combinedData);
        }
        setLoading(false);
    };

    const handleUpdateBudget = async (categoryId: string, amount: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if exists update, else insert
        const budgetItem = budgets.find(b => b.categoryId === categoryId);

        if (budgetItem?.budgetId) {
            if (amount > 0) {
                await supabase
                    .from("budgets")
                    .update({ amount })
                    .eq("id", budgetItem.budgetId);
            } else {
                await supabase
                    .from("budgets")
                    .delete()
                    .eq("id", budgetItem.budgetId);
            }
        } else if (amount > 0) {
            await supabase
                .from("budgets")
                .insert({
                    user_id: user.id,
                    category_id: categoryId,
                    amount,
                    month_year: currentMonthYear
                });
        }

        fetchData(); // Refresh to ensure sync
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Orçamentos Mensais</h1>
                <p className="text-muted-foreground">Defina limites de gastos para o mês atual ({currentMonthYear}).</p>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <p>Carregando...</p>
                ) : budgets.length === 0 ? (
                    <p>Nenhuma categoria de despesa encontrada.</p>
                ) : (
                    budgets.map((item) => {
                        const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
                        let progressColor = "bg-green-500";
                        if (percentage > 80) progressColor = "bg-yellow-500";
                        if (percentage > 100) progressColor = "bg-red-500";

                        return (
                            <div key={item.categoryId} className="bg-white dark:bg-card p-6 rounded-3xl border border-border shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{item.categoryName}</h3>
                                        <div className="text-sm text-muted-foreground">
                                            Gasto: <span className="font-medium text-foreground">R$ {item.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`budget-${item.categoryId}`} className="whitespace-nowrap">Meta:</Label>
                                        <Input
                                            id={`budget-${item.categoryId}`}
                                            type="number"
                                            className="w-32"
                                            defaultValue={item.budget || ''}
                                            onBlur={(e) => handleUpdateBudget(item.categoryId, parseFloat(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{percentage.toFixed(0)}%</span>
                                        <span>R$ {item.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <Progress value={percentage} className={`h-2`} indicatorClassName={progressColor} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
