"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ReceiptText, ChevronRight, BellRing, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PayablesModal } from "./payables-modal";
import { AddTransactionModal } from "@/features/transactions/add-transaction-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/features/transactions/transaction-form";

interface PayableAccountsProps {
    variant?: "card" | "sidebar";
    selectedDate?: Date;
}

interface PayableItem {
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
}

export function PayableAccounts({ variant = "card", selectedDate }: PayableAccountsProps) {
    const [pendingCount, setPendingCount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [latestItems, setLatestItems] = useState<PayableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchPayables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate?.getMonth(), selectedDate?.getFullYear()]);

    const fetchPayables = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const ref = selectedDate ?? new Date();
            const start = new Date(ref.getFullYear(), ref.getMonth(), 1).toISOString();
            const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const { data: allPending } = await supabase
                .from("transactions")
                .select("id, amount, description, date, status, type, wallet_id, category_id, payment_method, is_recurring, recurrence_interval, recurrence_end_date")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .neq("status", "completed")
                .gte("date", start)
                .lte("date", end)
                .order("date", { ascending: true });

            if (allPending) {
                setPendingCount(allPending.length);
                const total = allPending.reduce((acc, curr) => acc + curr.amount, 0);
                setTotalAmount(total);
                setLatestItems(allPending.slice(0, 3) as PayableItem[]);
            }
        }
        setLoading(false);
    };

    const handleEdit = (item: PayableItem) => {
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

    const content = (
        <div className="flex flex-col h-full">
            {/* Header info */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-foreground border border-foreground rounded-none text-background shadow-none">
                            <BellRing size={14} className="stroke-[2.5px]" />
                        </div>
                        <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Saídas Programadas</h3>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] pl-8">
                        Deste Ciclo Operacional
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-foreground tracking-tighter tabular-nums">
                        {loading ? <Skeleton className="h-6 w-24 ml-auto" /> : `R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </div>
                    <div className="text-[9px] font-black text-primary uppercase tracking-[0.1em] border border-border bg-secondary/50 px-2 py-0.5 inline-block mt-1">
                        {loading ? "..." : `${pendingCount} PENDENTES`}
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-2 mt-3 min-h-[140px]">
                <div className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 border-b border-border/50 pb-1">Cronograma de Vencimento</div>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full rounded-none" />
                        <Skeleton className="h-12 w-full rounded-none" />
                        <Skeleton className="h-12 w-full rounded-none" />
                    </div>
                ) : latestItems.length > 0 ? (
                    <div className="space-y-1">
                        {latestItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-none bg-secondary/10 border border-border/30 hover:border-primary/40 hover:bg-secondary/40 transition-all group/item">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Calendar badge */}
                                    <div className="w-10 h-10 rounded-none bg-background border border-border flex flex-col items-center justify-center shadow-none group-hover/item:border-primary/50 transition-all relative overflow-hidden shrink-0">
                                        <div className="absolute top-0 w-full h-1 bg-primary/20 group-hover/item:bg-primary transition-colors" />
                                        <span className="text-[7px] font-black text-primary leading-none mt-1 uppercase tracking-widest">{format(new Date(item.date), "MMM", { locale: ptBR })}</span>
                                        <span className="text-[14px] font-black text-foreground leading-none">{format(new Date(item.date), "dd")}</span>
                                    </div>

                                    {/* Text */}
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-foreground line-clamp-1 uppercase tracking-tight">{item.description}</span>
                                            {item.is_recurring && (
                                                <span className="text-[7px] font-black text-primary border border-primary/40 bg-primary/5 px-1 py-px rounded-none uppercase tracking-widest shrink-0">♻</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                            {(() => {
                                                const itemDate = new Date(item.date);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                itemDate.setHours(0, 0, 0, 0);
                                                const diff = Math.floor((itemDate.getTime() - today.getTime()) / 86400000);
                                                if (diff === 0) return <span className="text-rose-500">HOJE</span>;
                                                if (diff === 1) return <span className="text-amber-500">AMANHÃ</span>;
                                                if (diff < 0) return <span className="text-destructive">ATRASADA</span>;
                                                return `EM ${diff} DIAS`;
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                {/* Value + edit button */}
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className="text-sm font-black text-foreground tabular-nums">
                                        R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="opacity-0 group-hover/item:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center border border-border hover:border-primary hover:text-primary text-muted-foreground rounded-none bg-background"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/50 rounded-none bg-secondary/5 mt-2">
                        <ReceiptText className="w-6 h-6 text-muted-foreground/30 mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">ZERADO PARA ESTE CICLO</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border">
                <Button
                    variant="ghost"
                    onClick={() => setOpen(true)}
                    className="w-full justify-between h-10 px-4 rounded-none hover:bg-primary hover:text-primary-foreground group transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Visão Completa</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            <PayablesModal open={open} onOpenChange={setOpen} onUpdate={fetchPayables} selectedDate={selectedDate} />
        </div>
    );

    if (variant === "sidebar") {
        return (
            <div className="bg-card border border-border rounded-none p-6 shadow-none">
                {content}
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-card border border-border rounded-none p-6 flex flex-col shadow-none transition-all duration-300">
            {content}
            {/* Edit Modal from mini card */}
            {editingTx && (
                <AddTransactionModal
                    transaction={editingTx}
                    open={editOpen}
                    onOpenChange={(v) => {
                        setEditOpen(v);
                        if (!v) {
                            setEditingTx(null);
                            fetchPayables();
                        }
                    }}
                />
            )}
        </div>
    );
}

// aria-label
