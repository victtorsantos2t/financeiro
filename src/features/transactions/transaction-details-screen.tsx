"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, ShoppingBag, Utensils, Store, CircleDollarSign,
    ArrowUpRight, ArrowDownRight, Share2, Info, Clock, CheckCircle2,
    ChevronDown, Check, Loader2
} from "lucide-react";
import { format, differenceInDays, startOfDay, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { services } from "@/core/application/services/services.factory";
import { toast } from "sonner";

interface Category { id: string; name: string; type?: string; }

interface TransactionDetailsScreenProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: Record<string, any> | null | undefined;
    onBack: () => void;
    showValues?: boolean;
    onCategoryUpdated?: (transactionId: string, newCategoryId: string, newCategoryName: string) => void;
}

export function TransactionDetailsScreen({
    transaction,
    onBack,
    showValues = true,
    onCategoryUpdated,
}: TransactionDetailsScreenProps) {
    // Category editing state - hooks MUST be before any early return
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentCategory, setCurrentCategory] = useState<{ id: string; name: string }>(
        transaction ? { id: transaction.category?.id ?? "", name: transaction.category?.name ?? "Geral" } : { id: "", name: "Geral" }
    );
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [savingCategory, setSavingCategory] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load categories matching transaction type
    useEffect(() => {
        if (!transaction) return;
        services.categories.list(transaction.type).then(setCategories).catch(() => { });
    }, [transaction?.type, transaction]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!transaction) return null;

    const isIncome = transaction.type === "income";
    const isPending = transaction.status === "pending";
    const date = new Date(transaction.date);
    const today = startOfDay(new Date());
    const transactionDate = startOfDay(date);
    const daysRemaining = differenceInDays(transactionDate, today);

    const handleSelectCategory = async (cat: Category) => {
        if (cat.id === currentCategory.id) { setIsCategoryOpen(false); return; }
        setSavingCategory(true);
        setIsCategoryOpen(false);
        try {
            await services.transactions.updateTransaction(transaction.id, { category_id: cat.id });
            setCurrentCategory({ id: cat.id, name: cat.name });
            onCategoryUpdated?.(transaction.id, cat.id, cat.name);
            toast.success(`Categoria atualizada: ${cat.name}`);
        } catch (e) {
            toast.error("Erro ao atualizar categoria.");
            console.error(e);
        } finally {
            setSavingCategory(false);
        }
    };

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
        const cls = "p-4 rounded-none bg-background text-foreground border-2 border-border";
        if (desc.includes("pix recebido") || cat.includes("receita"))
            return <div className={cls}><ArrowDownRight className="h-8 w-8" strokeWidth={2.5} /></div>;
        if (desc.includes("pix enviado") || cat.includes("transferencia"))
            return <div className={cls}><ArrowUpRight className="h-8 w-8" strokeWidth={2.5} /></div>;
        if (desc.includes("burger") || desc.includes("restaurante") || cat.includes("alimentacao"))
            return <div className={cls}><Utensils className="size-8" strokeWidth={2.5} /></div>;
        if (cat.includes("compras") || desc.includes("shpp"))
            return <div className={cls}><ShoppingBag className="size-8" strokeWidth={2.5} /></div>;
        if (cat.includes("servicos") || desc.includes("conveniencia") || desc.includes("mercado"))
            return <div className={cls}><Store className="size-8" strokeWidth={2.5} /></div>;
        return <div className={cls}><CircleDollarSign className="size-8" strokeWidth={2.5} /></div>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col min-h-screen bg-card border-x border-border max-w-2xl mx-auto shadow-none"
        >
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between border-b border-border bg-secondary/50">
                <button
                    onClick={onBack}
                    className="flex justify-center items-center h-[42px] w-[42px] text-foreground bg-transparent border-2 border-transparent hover:border-border hover:bg-secondary rounded-none transition-all active:scale-95 -ml-2"
                >
                    <ChevronLeft className="h-6 w-6 stroke-[3]" />
                </button>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-none border-2",
                        isPending
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    )}>
                        {isPending ? "Agendado" : "Pago"}
                    </span>
                </div>
            </header>

            <div className="px-6 flex-1 max-w-2xl mx-auto w-full pb-10">
                {/* Icon & Description Area */}
                <div className="flex flex-col items-start mt-8 mb-10">
                    {getCategoryIcon(currentCategory.name, transaction.description)}
                    <div className="mt-8 space-y-2">
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isPending && daysRemaining < 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                            {getStatusLabel()}
                        </p>
                        <h2 className="text-2xl font-black uppercase tracking-tight leading-tight text-foreground">
                            {transaction.description}
                        </h2>
                        <p className="text-3xl font-black uppercase tracking-widest mt-4 text-foreground">
                            {isIncome ? "" : "- "}
                            {showValues
                                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(transaction.amount)
                                : "R$ ••••"}
                        </p>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-4">
                            {isPending ? "Vencimento em " : "Pago em "}
                            {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {!isPending && format(date, " 'às' HH:mm", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                {/* Details Sections */}
                <div className="space-y-0 mt-8 border-t border-border">
                    {/* Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-b border-border gap-2">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status da Transação</p>
                            <p className={cn(
                                "font-black uppercase tracking-widest text-xs flex items-center gap-2",
                                isPending ? "text-amber-500" : "text-emerald-500"
                            )}>
                                {isPending
                                    ? <Clock className="h-4 w-4 stroke-[3]" />
                                    : <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
                                {isPending ? "Aguardando pagamento" : "Efetivado com sucesso"}
                            </p>
                        </div>
                    </div>

                    {/* Enviado para / Recebido de */}
                    <div className="space-y-2 py-6 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {isIncome ? "Recebido de" : "Enviado para"}
                        </p>
                        <p className="text-foreground font-black text-sm uppercase tracking-widest">{transaction.description}</p>
                    </div>

                    {/* Instituição */}
                    <div className="space-y-2 py-6 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instituição</p>
                        <p className="text-foreground font-black text-sm uppercase tracking-widest">
                            {transaction.wallet?.name || "Instituição Financeira"}
                        </p>
                    </div>

                    {/* ── Categoria (editável) ── */}
                    <div className="py-6 border-b border-border" ref={dropdownRef}>
                        <button
                            className="w-full flex items-center justify-between group transition-colors hover:bg-secondary/40 -mx-2 px-2 py-1 rounded-none"
                            onClick={() => setIsCategoryOpen((v) => !v)}
                            disabled={savingCategory}
                        >
                            <div className="space-y-1 text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Categoria
                                    <span className="ml-2 text-primary/70 normal-case font-bold tracking-normal text-[9px]">
                                        · toque para editar
                                    </span>
                                </p>
                                <p className={cn(
                                    "font-black text-sm uppercase tracking-widest transition-colors",
                                    savingCategory ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                                )}>
                                    {savingCategory
                                        ? <span className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</span>
                                        : currentCategory.name}
                                </p>
                            </div>
                            <ChevronDown className={cn(
                                "h-5 w-5 text-muted-foreground group-hover:text-foreground transition-all",
                                isCategoryOpen && "rotate-180"
                            )} />
                        </button>

                        {/* Dropdown */}
                        <AnimatePresence>
                            {isCategoryOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.15 }}
                                    className="mt-2 border-2 border-border bg-card shadow-lg overflow-hidden"
                                >
                                    {categories.length === 0 ? (
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground p-4 text-center">
                                            Nenhuma categoria disponível
                                        </p>
                                    ) : (
                                        <div className="max-h-52 overflow-y-auto divide-y divide-border">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => handleSelectCategory(cat)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                                                        cat.id === currentCategory.id && "bg-secondary"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        cat.id === currentCategory.id ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {cat.name}
                                                    </span>
                                                    {cat.id === currentCategory.id && (
                                                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Info Note */}
                <div className="mt-12 p-5 bg-background border-2 border-border rounded-none flex gap-4">
                    <Info className="h-6 w-6 text-foreground shrink-0 stroke-[2.5]" />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                        {isPending
                            ? "Esta transação está agendada e será processada automaticamente na data de vencimento."
                            : "Para alterar outros dados como valor ou data, exclua e recadastre a transação."}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 mt-auto flex justify-center border-t border-border bg-card pb-safe-bottom">
                <button className="flex items-center justify-center gap-2 text-foreground bg-transparent border-2 border-border h-[42px] px-6 w-full rounded-none font-black uppercase tracking-widest text-[10px] hover:bg-secondary transition-all active:scale-95">
                    <Share2 className="h-4 w-4 stroke-[3]" />
                    {isPending ? "COMPARTILHAR AGENDAMENTO" : "COMPARTILHAR COMPROVANTE"}
                </button>
            </div>
        </motion.div>
    );
}

// aria-label
