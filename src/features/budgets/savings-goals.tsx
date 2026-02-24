"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { differenceInMonths, isValid } from "date-fns";
import { Loader2, Plus, Target, Flame, Shield, TrendingUp, Trash2, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

type Goal = {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
};

export function SavingsGoals() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [deadline, setDeadline] = useState("");

    const supabase = createClient();

    const fetchGoals = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from("goals")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (data) setGoals(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchGoals();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            name,
            target_amount: parseFloat(targetAmount) || 0,
            current_amount: parseFloat(currentAmount) || 0,
            deadline: deadline,
        };

        if (editId) {
            const { error } = await supabase.from("goals").update(payload).eq("id", editId);
            if (error) toast.error("Erro ao atualizar meta");
            else toast.success("Meta atualizada com sucesso");
        } else {
            const { error } = await supabase.from("goals").insert(payload);
            if (error) toast.error("Erro ao criar meta");
            else toast.success("Meta criada com sucesso");
        }

        setIsDialogOpen(false);
        resetForm();
        fetchGoals();
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("goals").delete().eq("id", id);
        if (error) toast.error("Erro ao deletar meta");
        else {
            toast.success("Meta deletada");
            fetchGoals();
        }
    };

    const openEdit = (goal: Goal) => {
        setEditId(goal.id);
        setName(goal.name);
        setTargetAmount(goal.target_amount.toString());
        setCurrentAmount(goal.current_amount.toString());
        setDeadline(goal.deadline);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditId(null);
        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setDeadline("");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-[14px] font-black uppercase tracking-widest text-foreground">Planejamento de Metas Flexíveis</h2>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Simule resgates agressivos, moderados e passivos.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(val) => {
                    setIsDialogOpen(val);
                    if (!val) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="h-10 rounded-none border-2 border-border gap-2 font-black uppercase tracking-widest text-[10px] shadow-none">
                            <Plus className="h-4 w-4" />
                            Nova Meta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-none rounded-none shadow-none p-0 overflow-hidden">
                        <DialogHeader className="p-6 bg-background border-b-2 border-border">
                            <DialogTitle className="text-[14px] uppercase tracking-widest font-black">{editId ? "Editar Meta" : "Criar Nova Meta (Poupança)"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest">Nome da Meta (Ex: Viagem, Carro)</Label>
                                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Objetivo..." className="rounded-none border-2 h-10 text-xs font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Valor Alvo (R$)</Label>
                                    <Input required type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0.00" className="rounded-none border-2 h-10 text-xs font-bold font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Já Investido (R$)</Label>
                                    <Input required type="number" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0.00" className="rounded-none border-2 h-10 text-xs font-bold font-mono" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest">Data Limite (Deadline)</Label>
                                <Input required type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-none border-2 h-10 text-xs font-bold" />
                            </div>
                            <Button disabled={saving} type="submit" className="w-full h-12 mt-4 rounded-none gap-2">
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                Salvar Planejamento
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 bg-card border border-border">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-card border border-border">
                    <Target className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Nenhuma meta configurada ainda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {goals.map(goal => {
                        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                        const remaining = Math.max(0, goal.target_amount - goal.current_amount);

                        let monthsLeft = 1;
                        if (goal.deadline && isValid(new Date(goal.deadline))) {
                            monthsLeft = Math.max(1, differenceInMonths(new Date(goal.deadline), new Date()));
                        }

                        // Calcular trilhas
                        const baseMonthly = remaining / monthsLeft;
                        const moderateMonthly = baseMonthly * 1.3; // tenta adiantar
                        const aggressiveMonthly = baseMonthly * 1.8; // agride pesado o alvo

                        const isFinished = remaining === 0;

                        return (
                            <div key={goal.id} className="bg-card border-2 border-border p-0 flex flex-col group relative">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button onClick={() => openEdit(goal)} variant="outline" size="icon" className="h-8 w-8 rounded-none border border-border bg-secondary">
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button onClick={() => handleDelete(goal.id)} variant="outline" size="icon" className="h-8 w-8 rounded-none border border-border bg-destructive text-destructive-foreground hover:bg-destructive/80">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="p-6 border-b-2 border-border bg-secondary/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 text-primary border border-primary/20">
                                            <Target className="h-5 w-5 stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">{goal.name}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-1">META PARA {monthsLeft} MESES ({new Date(goal.deadline).toLocaleDateString('pt-BR')})</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-between items-end mb-2">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Progresso ({progress.toFixed(1)}%)</span>
                                        <span className="text-xl font-black text-foreground">
                                            R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs text-muted-foreground mr-1">de R$ {goal.target_amount.toLocaleString('pt-BR')}</span>
                                        </span>
                                    </div>
                                    <Progress value={progress} className="h-3 bg-secondary border border-border rounded-none" indicatorClassName={isFinished ? "bg-[#00e676]" : "bg-primary"} />
                                </div>

                                {!isFinished && (
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y-2 md:divide-y-0 md:divide-x-2 divide-border bg-card">
                                        <div className="p-4 flex flex-col items-center justify-center text-center">
                                            <Shield className="h-5 w-5 mb-2 text-muted-foreground" />
                                            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase mb-1">Básico (No Prazo)</span>
                                            <span className="text-[13px] font-black text-foreground">R$ {baseMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-[9px]">/mês</span></span>
                                        </div>
                                        <div className="p-4 flex flex-col items-center justify-center text-center bg-primary/5">
                                            <TrendingUp className="h-5 w-5 mb-2 text-primary" />
                                            <span className="text-[9px] font-black tracking-widest text-primary uppercase mb-1">Moderado (Rápido)</span>
                                            <span className="text-[13px] font-black text-primary">R$ {moderateMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-[9px]">/mês</span></span>
                                        </div>
                                        <div className="p-4 flex flex-col items-center justify-center text-center bg-destructive/5">
                                            <Flame className="h-5 w-5 mb-2 text-destructive" />
                                            <span className="text-[9px] font-black tracking-widest text-destructive uppercase mb-1">Agressivo (Choque)</span>
                                            <span className="text-[13px] font-black text-destructive">R$ {aggressiveMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-[9px]">/mês</span></span>
                                        </div>
                                    </div>
                                )}

                                {isFinished && (
                                    <div className="p-6 bg-[#00e676]/10 text-[#00e676] text-center">
                                        <p className="text-[12px] font-black tracking-widest uppercase">META ATINGIDA! VOCÊ É UM VENCEDOR.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// aria-label
