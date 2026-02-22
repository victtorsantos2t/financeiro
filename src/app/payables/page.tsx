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
import { AddTransactionModal } from "@/features/transactions/add-transaction-modal";
import { IOSPageHeader } from "@/components/layout/ios-page-header";

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
        <div className="space-y-6 pb-12">
            <IOSPageHeader
                title="Contas a Pagar"
                subtitle="Compromissos financeiros"
                action={<AddTransactionModal />}
            />
            {/* Header Card — Desktop Only */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-card p-6 rounded-card shadow-sm border border-border">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 hover:bg-secondary transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas a Pagar</h1>
                        <p className="text-sm text-muted-foreground font-medium">Gerencie seus compromissos financeiros futuros.</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Pendente</p>
                        <p className="text-2xl font-bold text-destructive">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <AddTransactionModal />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-card rounded-card border border-border shadow-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground font-bold">Buscando suas contas...</p>
                    </div>
                ) : payables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-card rounded-card border border-border shadow-sm space-y-4">
                        <div className="p-5 bg-success/10 rounded-full">
                            <CheckCircle2 className="h-10 w-10 text-success" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-foreground">Tudo em dia!</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Você não tem contas pendentes para o momento.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {payables.map((payable) => (
                            <div key={payable.id} className="group bg-card rounded-card p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between h-full">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-secondary rounded-xl text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Vencimento</p>
                                            <div className="flex items-center gap-1.5 justify-end text-foreground font-bold text-sm">
                                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                                {format(new Date(payable.date), "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-foreground line-clamp-1 tracking-tight">{payable.description}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                            {payable.category?.name || "Sem Categoria"}
                                        </p>
                                    </div>

                                    <div className="flex items-baseline gap-1 pt-2">
                                        <span className="text-sm font-bold text-muted-foreground">R$</span>
                                        <span className="text-3xl font-bold text-foreground tracking-tight">
                                            {payable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border">
                                    <Button
                                        onClick={() => handlePay(payable.id)}
                                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold gap-2 shadow-sm transition-all"
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
