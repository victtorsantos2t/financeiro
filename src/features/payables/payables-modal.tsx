"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Check, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area"; // Removing this import
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface PayablesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

type Payable = {
    id: string;
    description: string;
    amount: number;
    date: string;
    category?: { name: string };
};

export function PayablesModal({ open, onOpenChange, onUpdate }: PayablesModalProps) {
    const [payables, setPayables] = useState<Payable[]>([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (open) {
            fetchPayables();
        }
    }, [open]);

    const fetchPayables = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data } = await supabase
                .from("transactions")
                .select("id, description, amount, date, category:categories(name)")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .neq("status", "completed")
                .order("date", { ascending: true });

            if (data) setPayables(data as any);
        }
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

            toast.success(`Conta "${description}" paga com sucesso!`);
            fetchPayables();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error paying bill:", error);
            toast.error("Erro ao pagar conta");
        } finally {
            setPayingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#1C1C1E] rounded-3xl p-0 overflow-hidden border-slate-100 dark:border-white/10 shadow-xl">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        Contas Pendentes
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
                        Gerencie suas contas a pagar e mantenha o dia.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-[400px] w-full px-6 overflow-y-auto custom-scrollbar">
                    <div className="py-4 space-y-3">
                        {loading && !payables.length ? (
                            <div className="flex items-center justify-center py-8 text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : payables.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="text-slate-900 dark:text-white font-bold mb-1">Tudo em dia!</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Você não tem contas pendentes.</p>
                            </div>
                        ) : (
                            payables.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 dark:text-white truncate">
                                                {item.description}
                                            </span>
                                            {item.category?.name && (
                                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md uppercase tracking-wide whitespace-nowrap">
                                                    {item.category.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {format(new Date(item.date), "dd 'de' MMM", { locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => handlePay(item.id, item.description)}
                                        disabled={payingId === item.id}
                                        className="h-8 w-8 rounded-xl p-0 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800 shadow-sm shrink-0"
                                    >
                                        {payingId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
