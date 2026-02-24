"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Check, FileText, Loader2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AddTransactionModal } from "@/features/transactions/add-transaction-modal";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/features/transactions/transaction-form";

interface PayablesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
    /** Mês de referência do dashboard — filtra as contas exibidas */
    selectedDate?: Date;
}

type Payable = {
    id: string;
    description: string;
    amount: number;
    date: string;
    status: string;
    type: string;
    wallet_id: string;
    category_id: string;
    payment_method: string;
    is_recurring: boolean;
    recurrence_interval?: string;
    recurrence_end_date?: string;
    category?: { name: string };
};

const PAGE_SIZE = 8;

export function PayablesModal({ open, onOpenChange, onUpdate, selectedDate }: PayablesModalProps) {
    const [payables, setPayables] = useState<Payable[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<string | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const supabase = createClient();

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const refMonth = selectedDate ?? new Date();

    useEffect(() => {
        if (open) { setPage(1); fetchPayables(1); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, selectedDate]);

    useEffect(() => {
        if (open) fetchPayables(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const fetchPayables = async (p: number) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Filtra pelo mês de referência do dashboard
        const start = new Date(refMonth.getFullYear(), refMonth.getMonth(), 1).toISOString();
        const end = new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // Conta total para paginação
        const { count } = await supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "expense")
            .neq("status", "completed")
            .gte("date", start)
            .lte("date", end);

        setTotal(count ?? 0);

        const from = (p - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data } = await supabase
            .from("transactions")
            .select("id, description, amount, date, status, type, wallet_id, category_id, payment_method, is_recurring, recurrence_interval, recurrence_end_date, category:categories(name)")
            .eq("user_id", user.id)
            .eq("type", "expense")
            .neq("status", "completed")
            .gte("date", start)
            .lte("date", end)
            .order("date", { ascending: true })
            .range(from, to);

        if (data) setPayables(data as unknown as Payable[]);
        setLoading(false);
    };

    const handlePay = async (id: string, description: string) => {
        setPayingId(id);
        try {
            const { error } = await supabase
                .from("transactions")
                .update({ status: "completed" })
                .eq("id", id);
            if (error) throw error;
            toast.success(`"${description}" marcada como paga!`);
            fetchPayables(page);
            onUpdate?.();
        } catch {
            toast.error("Erro ao marcar como paga");
        } finally {
            setPayingId(null);
        }
    };

    const handleEdit = (item: Payable) => {
        setEditingTx({
            id: item.id,
            description: item.description,
            amount: item.amount,
            type: item.type as "income" | "expense",
            date: item.date,
            status: item.status as "completed" | "pending",
            wallet_id: item.wallet_id,
            category_id: item.category_id,
            payment_method: item.payment_method ?? "pix",
            is_recurring: item.is_recurring,
            recurrence_interval: item.recurrence_interval,
            recurrence_end_date: item.recurrence_end_date,
        });
        setEditOpen(true);
    };

    const getDaysLabel = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
        if (diff === 0) return <span className="text-rose-500 font-black">HOJE</span>;
        if (diff === 1) return <span className="text-amber-500 font-black">AMANHÃ</span>;
        if (diff < 0) return <span className="text-destructive font-black">ATRASADA {Math.abs(diff)}d</span>;
        return <span>EM {diff} DIAS</span>;
    };

    const monthLabel = format(refMonth, "MMMM 'de' yyyy", { locale: ptBR });

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] bg-card rounded-none p-0 overflow-hidden border-2 border-border shadow-none">
                    {/* Header */}
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                        <DialogTitle className="text-[12px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                            <div className="w-8 h-8 rounded-none border-2 border-orange-500 bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <FileText className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            Contas Pendentes
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center justify-between">
                            <span>Gerencie suas contas a pagar e mantenha o dia.</span>
                            <span className="text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-none capitalize">
                                {monthLabel}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    {/* List */}
                    <div className="px-4 py-3 space-y-2 min-h-[320px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : payables.length === 0 ? (
                            <div className="text-center py-10 border-2 border-border bg-secondary/10 mx-2 my-4">
                                <div className="w-12 h-12 bg-emerald-500/10 border-2 border-emerald-500 rounded-none flex items-center justify-center mx-auto mb-3 text-emerald-500">
                                    <Check className="w-6 h-6 stroke-[3]" />
                                </div>
                                <h4 className="text-foreground text-[12px] uppercase font-black tracking-widest mb-1">Tudo em dia!</h4>
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                                    Sem pendências em {monthLabel}.
                                </p>
                            </div>
                        ) : (
                            payables.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-none border border-border hover:border-primary/40 bg-background hover:bg-secondary/20 transition-all group"
                                >
                                    {/* Info */}
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate max-w-[160px]">
                                                {item.description}
                                            </span>
                                            {item.is_recurring && (
                                                <span className="text-[8px] font-black text-primary bg-primary/10 border border-primary/30 px-1.5 py-px rounded-none uppercase tracking-wider whitespace-nowrap">
                                                    ♻ Recorrente
                                                </span>
                                            )}
                                            {item.category?.name && (
                                                <span className="text-[8px] font-bold text-muted-foreground bg-secondary border border-border px-1.5 py-px rounded-none uppercase tracking-widest whitespace-nowrap">
                                                    {item.category.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <span className="text-foreground font-black text-[10px]">
                                                R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-border">•</span>
                                            <span>{format(new Date(item.date), "dd 'de' MMM", { locale: ptBR })}</span>
                                            <span className="text-border">•</span>
                                            {getDaysLabel(item.date)}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button size="sm" variant="ghost"
                                            onClick={() => handleEdit(item)}
                                            className="h-8 w-8 rounded-none p-0 border border-transparent hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-muted-foreground shadow-none"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm"
                                            onClick={() => handlePay(item.id, item.description)}
                                            disabled={payingId === item.id}
                                            className="h-8 w-8 rounded-none p-0 bg-transparent border border-border text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500 shadow-none"
                                        >
                                            {payingId === item.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Check className="w-4 h-4 stroke-[3]" />}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                {total} conta{total !== 1 ? "s" : ""} · página {page}/{totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={cn(
                                        "h-8 w-8 flex items-center justify-center border rounded-none transition-all",
                                        page === 1
                                            ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                                            : "border-border hover:border-primary hover:text-primary text-foreground"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {/* Page numbers */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setPage(n)}
                                        className={cn(
                                            "h-8 w-8 flex items-center justify-center border rounded-none text-[10px] font-black transition-all",
                                            n === page
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "border-border hover:border-primary hover:text-primary text-muted-foreground"
                                        )}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className={cn(
                                        "h-8 w-8 flex items-center justify-center border rounded-none transition-all",
                                        page === totalPages
                                            ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                                            : "border-border hover:border-primary hover:text-primary text-foreground"
                                    )}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            {editingTx && (
                <AddTransactionModal
                    transaction={editingTx}
                    open={editOpen}
                    onOpenChange={(v) => {
                        setEditOpen(v);
                        if (!v) {
                            setEditingTx(null);
                            fetchPayables(page);
                            onUpdate?.();
                        }
                    }}
                />
            )}
        </>
    );
}

// aria-label
