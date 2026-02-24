"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { IOSPageHeader } from "@/components/layout/ios-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsGoals } from "@/features/budgets/savings-goals";

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

    async function fetchData() {
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
            const today = new Date();
            const startOfCurrMonth = startOfMonth(today).toISOString();
            const endOfCurrMonth = endOfMonth(today).toISOString();

            const { data: transactions } = await supabase
                .from("transactions")
                .select("category_id, amount")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .eq("type", "expense")
                .gte("date", startOfCurrMonth)
                .lte("date", endOfCurrMonth);

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
        <div className="space-y-6 pb-12">
            <IOSPageHeader title="Orçamentos" subtitle="Controle de limites mensais" />

            <div className="hidden md:flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Orçamentos Mensais</h1>
                <p className="text-sm text-muted-foreground font-medium">Defina limites de gastos para o mês atual ({currentMonthYear}).</p>
            </div>

            <Tabs defaultValue="orcamentos" className="w-full mt-6">
                <TabsList className="w-full grid grid-cols-2 mb-6">
                    <TabsTrigger value="orcamentos">CONTROLE DE TETOS</TabsTrigger>
                    <TabsTrigger value="metas">POUPANÇA & EVENTOS</TabsTrigger>
                </TabsList>

                <TabsContent value="orcamentos" className="mt-0">
                    <div className="grid gap-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12 bg-card rounded-card border border-border">
                                <p className="text-muted-foreground font-bold">Carregando...</p>
                            </div>
                        ) : budgets.length === 0 ? (
                            <div className="flex items-center justify-center py-12 bg-card rounded-card border border-border font-bold">
                                <p className="text-muted-foreground">Nenhuma categoria de despesa encontrada.</p>
                            </div>
                        ) : (
                            budgets.map((item) => {
                                const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
                                let progressColor = "bg-success";
                                if (percentage > 80) progressColor = "bg-yellow-500";
                                if (percentage > 100) progressColor = "bg-destructive";

                                return (
                                    <div key={item.categoryId} className="bg-card p-6 rounded-card border border-border shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-border pb-6 relative">
                                            <div>
                                                <h3 className="font-black text-[14px] uppercase tracking-widest text-foreground">{item.categoryName}</h3>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                    Já Gasto: <span className="text-foreground">R$ {item.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <Label htmlFor={`budget-${item.categoryId}`} className="whitespace-nowrap text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:block">TETO:</Label>
                                                <Input
                                                    id={`budget-${item.categoryId}`}
                                                    type="number"
                                                    className="w-full md:w-32 bg-secondary/50 rounded-none border-2 border-border h-10 font-bold"
                                                    defaultValue={item.budget || ''}
                                                    onBlur={(e) => handleUpdateBudget(item.categoryId, parseFloat(e.target.value))}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                <span>{percentage.toFixed(0)}% UTILIZADO DO TETO</span>
                                                <span>LIMITE: R$ {item.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <Progress value={percentage} className={`h-3 bg-secondary rounded-none border border-border`} indicatorClassName={progressColor} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="metas" className="mt-0">
                    <SavingsGoals />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// aria-label
