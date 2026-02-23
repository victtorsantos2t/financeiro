"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ReceiptText, CalendarClock, ChevronRight, BellRing } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PayablesModal } from "./payables-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PayableAccountsProps {
    variant?: "card" | "sidebar";
}

interface PayableItem {
    id: string;
    description: string;
    amount: number;
    date: string;
}

export function PayableAccounts({ variant = "card" }: PayableAccountsProps) {
    const [pendingCount, setPendingCount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [latestItems, setLatestItems] = useState<PayableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchPayables();
    }, []);

    const fetchPayables = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

            // Fetch all pending for the month to calculate total
            const { data: allPending } = await supabase
                .from("transactions")
                .select("amount, description, date, id")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .neq("status", "completed")
                .gte("date", start)
                .order("date", { ascending: true });

            if (allPending) {
                setPendingCount(allPending.length);
                const total = allPending.reduce((acc, curr) => acc + curr.amount, 0);
                setTotalAmount(total);

                // Set the 3 nearest items
                setLatestItems(allPending.slice(0, 3));
            }
        }
        setLoading(false);
    };

    const content = (
        <div className="flex flex-col h-full">
            {/* Header info */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-500 shadow-sm border border-rose-100/50 dark:border-rose-500/20">
                            <BellRing size={16} />
                        </div>
                        <h3 className="text-sm font-black text-foreground tracking-tight">Contas a Pagar</h3>
                    </div>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-10">
                        Ciclo Atual
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-foreground tracking-tighter">
                        {loading ? <Skeleton className="h-6 w-24 ml-auto" /> : `R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </div>
                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                        {loading ? "..." : `${pendingCount} pendentes`}
                    </div>
                </div>
            </div>

            {/* Middle Section: Last 3 Items */}
            <div className="flex-1 space-y-3 mt-2 min-h-[140px]">
                <div className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">Próximos Vencimentos</div>
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ) : latestItems.length > 0 ? (
                    <div className="space-y-2">
                        {latestItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex flex-col items-center justify-center border border-zinc-100 dark:border-white/5 shadow-sm group-hover/item:border-primary/20 transition-all">
                                        <span className="text-[8px] font-black text-rose-500 leading-none mb-0.5">{format(new Date(item.date), 'MMM', { locale: ptBR }).toUpperCase()}</span>
                                        <span className="text-[15px] font-black text-zinc-900 dark:text-white leading-none">{format(new Date(item.date), 'dd')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground line-clamp-1">{item.description}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {(() => {
                                                const itemDate = new Date(item.date);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                itemDate.setHours(0, 0, 0, 0);

                                                const diff = Math.floor((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                                                if (diff === 0) return "Vence hoje";
                                                if (diff === 1) return "Vence amanhã";
                                                if (diff < 0) return "Vencida";
                                                return `Vence em ${diff} dias`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-foreground">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-border/50 rounded-2xl bg-secondary/10">
                        <ReceiptText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-[10px] font-medium text-muted-foreground">Nenhuma conta pendente para este ciclo</p>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="mt-6 pt-4 border-t border-border/50">
                <Button
                    variant="ghost"
                    onClick={() => setOpen(true)}
                    className="w-full justify-between h-10 px-4 rounded-xl hover:bg-primary/5 hover:text-primary group transition-all"
                >
                    <span className="text-xs font-bold">Ver tudo</span>
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Button>
            </div>

            <PayablesModal
                open={open}
                onOpenChange={setOpen}
                onUpdate={fetchPayables}
            />
        </div>
    );

    if (variant === "sidebar") {
        <div className="bg-card rounded-card p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border-none">
            {content}
        </div>
    }

    return (
        <div className="w-full h-full bg-surface dark:bg-[#1C1C1E]/80 rounded-lg p-6 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.08)] border-none transition-all duration-300 backdrop-blur-sm">
            {content}
        </div>
    );
}

