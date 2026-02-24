"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";
import { useDashboard } from "@/context/dashboard-context";

type AlertInfo = {
    categoryName: string;
    exceededAmount: number;
    budget: number;
};

export function BudgetAlerts() {
    const { currentDate } = useDashboard();
    const [alerts, setAlerts] = useState<AlertInfo[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const checkBudgets = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Use the dashboard's globally selected month
            // Current month string from date: 
            // the month is determined by currentDate Context
            const year = currentDate.getFullYear();
            const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const targetMonthYear = `${year}-${monthStr}`;

            const startOfMontDt = startOfMonth(currentDate).toISOString();
            const endOfMontDt = endOfMonth(currentDate).toISOString();

            // fetch budgets for selected month
            const { data: budgets } = await supabase
                .from("budgets")
                .select("category_id, amount, categories(name)")
                .eq("user_id", user.id)
                .eq("month_year", targetMonthYear);

            if (!budgets || budgets.length === 0) {
                setAlerts([]);
                return;
            }

            // fetch transactions for those categories
            const categoryIds = budgets.map(b => b.category_id);
            const { data: transactions } = await supabase
                .from("transactions")
                .select("amount, category_id")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .gte("date", startOfMontDt)
                .lte("date", endOfMontDt)
                .in("category_id", categoryIds);

            if (!transactions) {
                setAlerts([]);
                return;
            }

            const newAlerts: AlertInfo[] = [];

            for (const budget of budgets) {
                const spent = transactions
                    .filter(t => t.category_id === budget.category_id)
                    .reduce((acc, curr) => acc + curr.amount, 0);

                if (spent > budget.amount) {
                    const typedBudget = budget as unknown as { categories: { name: string } | { name: string }[] };
                    const catName = Array.isArray(typedBudget.categories) ? typedBudget.categories[0]?.name : typedBudget.categories?.name;
                    newAlerts.push({
                        categoryName: catName || "Categoria",
                        exceededAmount: spent - budget.amount,
                        budget: budget.amount
                    });
                }
            }

            setAlerts(newAlerts);
        };

        checkBudgets();
    }, [currentDate, supabase]);

    if (alerts.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 lg:mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            {alerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-4 bg-destructive text-destructive-foreground p-4 lg:p-5 rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(15,23,42,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
                    <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 stroke-[3] shrink-0" />
                    <div className="flex-1">
                        <p className="text-[12px] lg:text-[14px] font-black uppercase tracking-widest leading-tight">
                            VOCÊ EXCEDEU A META EM: {alert.categoryName}
                        </p>
                        <p className="text-[10px] lg:text-[11px] font-bold mt-1 uppercase tracking-wider text-destructive-foreground/90">
                            R$ {alert.exceededAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ultrapassados (Teto inicial: R$ {alert.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// aria-label
