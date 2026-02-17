"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    FileText,
    CheckCircle2,
    Calendar,
    DollarSign,
    ArrowLeft,
    Plus,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";

type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    status: string;
    category: { name: string };
};

export default function PayablesPage() {
    const [payables, setPayables] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalAmount, setTotalAmount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        fetchPayables();
    }, []);

    const fetchPayables = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from("transactions")
                .select(`
                    *,
                    category:categories(name)
                `)
                .eq("user_id", user.id)
                .eq("status", "pending")
                .eq("type", "expense")
                .order("date", { ascending: true });

            if (error) {
                toast.error("Erro ao carregar contas: " + error.message);
            } else if (data) {
                setPayables(data as any);
                const total = data.reduce((acc, curr) => acc + curr.amount, 0);
                setTotalAmount(total);
            }
        }
        setLoading(false);
    };

    const handlePay = async (id: string) => {
        const { error } = await supabase
            .from("transactions")
            .update({ status: "completed" })
            .eq("id", id);

        if (error) {
            toast.error("Erro ao realizar pagamento: " + error.message);
        } else {
            toast.success("Pagamento registrado com sucesso!");
            fetchPayables();
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-10 rounded-[40px] shadow-sm border border-border">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="outline" size="icon" className="rounded-2xl h-12 w-12 hover:scale-105 transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Contas a Pagar</h1>
                        <p className="text-muted-foreground font-medium">Gerencie seus compromissos financeiros futuros.</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Pendente</p>
                        <p className="text-2xl font-black text-red-600">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <AddTransactionModal />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-card rounded-[40px] border border-border">
                        <Loader2 className="h-10 w-10 animate-spin text-[#1e293b] mb-4" />
                        <p className="text-muted-foreground font-bold">Buscando suas contas...</p>
                    </div>
                ) : payables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-card rounded-[40px] border border-border space-y-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-full">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-[#1e293b]">Tudo em dia!</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">Você não tem contas pendentes para o momento.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {payables.map((payable) => (
                            <div key={payable.id} className="group bg-white dark:bg-card rounded-[40px] p-8 shadow-sm border border-border hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between h-full">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl group-hover:bg-[#1e293b] group-hover:text-white transition-colors">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mb-1">Vencimento</p>
                                            <div className="flex items-center gap-1.5 justify-end text-[#1e293b] font-bold">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {format(new Date(payable.date), "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-[#1e293b] line-clamp-1">{payable.description}</h3>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                            {payable.category?.name || "Sem Categoria"}
                                        </p>
                                    </div>

                                    <div className="flex items-baseline gap-1 pt-2">
                                        <span className="text-sm font-bold text-muted-foreground">R$</span>
                                        <span className="text-3xl font-black text-[#1e293b]">
                                            {payable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100 flex gap-3">
                                    <Button
                                        onClick={() => handlePay(payable.id)}
                                        className="w-full h-14 rounded-2xl bg-[#1e293b] hover:bg-black text-white font-bold gap-2 shadow-lg shadow-slate-200"
                                    >
                                        <DollarSign className="h-5 w-5" />
                                        Marcar como Pago
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
