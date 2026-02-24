"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { BrainCircuit, Loader2, Save } from "lucide-react";
import { toast } from "sonner";


type CategoryBudget = {
    categoryId: string;
    categoryName: string;
    budget: number;
    budgetId?: string;
};

export function BudgetTargetModal() {
    const [open, setOpen] = useState(false);
    const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();
    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

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

            // 4. Combine Data
            const combinedData: CategoryBudget[] = categories.map(cat => {
                const budgetObj = existingBudgets?.find(b => b.category_id === cat.id);

                return {
                    categoryId: cat.id,
                    categoryName: cat.name,
                    budget: budgetObj?.amount || 0,
                    budgetId: budgetObj?.id
                };
            });

            setBudgets(combinedData);
        }
        setLoading(false);
    };

    const handleBudgetChange = (categoryId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setBudgets(prev => prev.map(b => b.categoryId === categoryId ? { ...b, budget: numValue } : b));
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setSaving(false);
            return;
        }

        try {
            for (const item of budgets) {
                if (item.budgetId) {
                    if (item.budget > 0) {
                        await supabase
                            .from("budgets")
                            .update({ amount: item.budget })
                            .eq("id", item.budgetId);
                    } else {
                        await supabase
                            .from("budgets")
                            .delete()
                            .eq("id", item.budgetId);
                    }
                } else if (item.budget > 0) {
                    await supabase
                        .from("budgets")
                        .insert({
                            user_id: user.id,
                            category_id: item.categoryId,
                            amount: item.budget,
                            month_year: currentMonthYear
                        });
                }
            }
            toast.success("Metas atualizadas com sucesso!");
            setOpen(false);
        } catch (error) {
            toast.error("Erro ao atualizar metas.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-[42px] px-6 gap-2 rounded-none border-2 border-border text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/50 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-none">
                    <BrainCircuit className="h-4 w-4 stroke-[3]" />
                    Ajustar Metas
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-none rounded-none shadow-none gap-0">
                <DialogHeader className="p-6 bg-background border-b-2 border-border">
                    <DialogTitle className="text-[14px] uppercase tracking-widest leading-none font-black text-foreground">Definir Metas Mensais</DialogTitle>
                    <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">
                        Estabeleça limites de gastos por categoria para o mês atual.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-6 bg-card">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carregando categorias...</p>
                        </div>
                    ) : budgets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhuma categoria de despesa encontrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {budgets.map(item => (
                                <div key={item.categoryId} className="flex items-center justify-between border-b-2 border-border pb-4 last:border-0 last:pb-0">
                                    <Label className="text-[12px] font-black uppercase tracking-widest text-foreground w-1/2 break-words">
                                        {item.categoryName}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase">R$</span>
                                        <Input
                                            type="number"
                                            value={item.budget || ''}
                                            onChange={(e) => handleBudgetChange(item.categoryId, e.target.value)}
                                            placeholder="0.00"
                                            className="w-24 h-8 text-[12px]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-secondary border-t-2 border-border flex justify-end">
                    <Button onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto h-[42px]">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2 stroke-[3]" />}
                        Salvar Metas
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// aria-label
