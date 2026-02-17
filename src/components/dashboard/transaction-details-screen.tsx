"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ShoppingBag, Utensils, Store, CircleDollarSign, ArrowUpRight, ArrowDownRight, Share2, Info, Clock, CheckCircle2 } from "lucide-react";
import { format, differenceInDays, startOfDay, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Transaction } from "./transaction-form";

interface TransactionDetailsScreenProps {
    transaction: any;
    onBack: () => void;
    showValues?: boolean;
}

export function TransactionDetailsScreen({ transaction, onBack, showValues = true }: TransactionDetailsScreenProps) {
    if (!transaction) return null;

    const isIncome = transaction.type === "income";
    const isPending = transaction.status === "pending";
    const date = new Date(transaction.date);
    const today = startOfDay(new Date());
    const transactionDate = startOfDay(date);

    const daysRemaining = differenceInDays(transactionDate, today);

    const getStatusLabel = () => {
        if (!isPending) return isIncome ? "Pagamento de pix recebido" : "Pagamento de pix enviado";

        if (isToday(transactionDate)) return "Vence hoje";
        if (isTomorrow(transactionDate)) return "Vence amanhã";
        if (daysRemaining < 0) return `Atrasado há ${Math.abs(daysRemaining)} dias`;
        return `Vence em ${daysRemaining} dias`;
    };

    const getCategoryIcon = (categoryName: string, description: string) => {
        const desc = description.toLowerCase();
        const cat = categoryName.toLowerCase();

        if (desc.includes('pix recebido') || cat.includes('receita')) {
            return <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"><ArrowDownRight className="h-8 w-8" /></div>;
        }

        if (desc.includes('pix enviado') || cat.includes('transferencia')) {
            return <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"><ArrowUpRight className="h-8 w-8" /></div>;
        }

        if (desc.includes('burger') || desc.includes('restaurante') || cat.includes('alimentacao')) {
            return <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"><Utensils className="size-8" /></div>;
        }

        if (cat.includes('compras') || desc.includes('shpp')) {
            return <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"><ShoppingBag className="size-8" /></div>;
        }

        if (cat.includes('servicos') || desc.includes('conveniencia') || desc.includes('mercado')) {
            return <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"><Store className="size-8" /></div>;
        }

        return <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"><CircleDollarSign className="size-8" strokeWidth={1.5} /></div>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col min-h-screen bg-white"
        >
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
                >
                    <ChevronLeft className="h-7 w-7" />
                </button>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                        isPending ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                        {isPending ? "Agendado" : "Pago"}
                    </span>
                </div>
            </header>

            <div className="px-6 flex-1 max-w-2xl mx-auto w-full">
                {/* Icon & Description Area */}
                <div className="flex flex-col items-start mt-4 mb-10">
                    {getCategoryIcon(transaction.category?.name || "Geral", transaction.description)}

                    <div className="mt-8 space-y-1">
                        <p className={cn(
                            "font-medium text-base",
                            isPending && daysRemaining < 0 ? "text-rose-500" : "text-slate-400"
                        )}>
                            {getStatusLabel()}
                        </p>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                            {transaction.description}
                        </h2>
                        <p className="text-2xl font-bold mt-2 text-slate-900">
                            {isIncome ? '' : '- '}
                            {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount) : "R$ ••••"}
                        </p>
                        <p className="text-slate-400 font-medium text-base mt-2">
                            {isPending ? "Vencimento em " : "Pago em "}
                            {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {!isPending && format(date, " 'às' HH:mm", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                {/* Details Sections */}
                <div className="space-y-8 mt-12">
                    {/* Status Section */}
                    <div className="flex items-center justify-between py-6 border-b border-slate-50">
                        <div className="space-y-2">
                            <p className="text-base font-bold text-slate-900 tracking-tight">
                                Status da Transação
                            </p>
                            <p className={cn(
                                "font-medium text-sm leading-relaxed flex items-center gap-2",
                                isPending ? "text-amber-600" : "text-emerald-600"
                            )}>
                                {isPending ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                {isPending ? "Aguardando pagamento" : "Efetivado com sucesso"}
                            </p>
                        </div>
                    </div>

                    {/* Enviado para / Recebido de */}
                    <div className="space-y-2 pb-6 border-b border-slate-50">
                        <p className="text-base font-bold text-slate-900 tracking-tight">
                            {isIncome ? "Recebido de" : "Enviado para"}
                        </p>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed uppercase tracking-wide">
                            {transaction.description}
                        </p>
                    </div>

                    {/* Instituição */}
                    <div className="space-y-2 pb-6 border-b border-slate-50">
                        <p className="text-base font-bold text-slate-900 tracking-tight">
                            Instituição
                        </p>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed uppercase tracking-wide">
                            {transaction.wallet?.name || "Instituição Financeira"}
                        </p>
                    </div>

                    {/* Categoria */}
                    <div className="flex items-center justify-between py-6 border-b border-slate-50 group cursor-pointer transition-colors active:bg-slate-50/50">
                        <div className="space-y-2">
                            <p className="text-base font-bold text-slate-900 tracking-tight">
                                Categoria
                            </p>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                {transaction.category?.name || "Outros"}
                            </p>
                        </div>
                        <ChevronLeft className="h-6 w-6 text-slate-300 rotate-180" />
                    </div>
                </div>

                {/* Info Note */}
                <div className="mt-12 p-5 bg-slate-50 rounded-2xl flex gap-4">
                    <Info className="h-6 w-6 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        {isPending
                            ? "Esta transação está agendada e será processada automaticamente na data de vencimento."
                            : "Esta é uma visualização detalhada da transação. Para correções ou alterações, consulte o suporte."}
                    </p>
                </div>
            </div>

            {/* Footer Actions if any, but screenshot shows blank bottom */}
            <div className="p-8 mt-auto flex justify-center">
                <button className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-tight opacity-40">
                    <Share2 className="h-4 w-4" />
                    {isPending ? "COMPARTILHAR AGENDAMENTO" : "COMPARTILHAR COMPROVANTE"}
                </button>
            </div>
        </motion.div>
    );
}
