import { createClient } from "@/lib/supabase/client";
import { services } from "@/core/application/services/services.factory";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ShoppingBag,
    Utensils,
    Store,
    ArrowUpRight,
    ArrowDownRight,
    CircleDollarSign,
    ListFilter,
    LayoutGrid,
    Maximize2,
    Minimize2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Transaction } from "./transaction-form";
import { useDashboard } from "@/context/dashboard-context";

// Extended type for display
interface TransactionWithDetails extends Transaction {
    category?: { name: string };
    wallet?: { name: string };
}

interface TransactionsTableProps {
    defaultCompact?: boolean;
    externalFilters?: any;
    activeTab?: 'recentes' | 'futuros';
    showValues?: boolean;
    onTransactionClick?: (transaction: TransactionWithDetails) => void;
    limit?: number;
}

export function TransactionsTable({
    defaultCompact = false,
    externalFilters,
    activeTab = 'recentes',
    showValues = true,
    onTransactionClick,
    limit
}: TransactionsTableProps) {
    const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCompact, setIsCompact] = useState(defaultCompact);
    // Remove local filters state and use props

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 25;

    const supabase = createClient();
    const { refreshTrigger } = useDashboard();

    useEffect(() => {
        setCurrentPage(1);
    }, [externalFilters, activeTab, isCompact]);

    useEffect(() => {
        fetchTransactions();

        const channel = supabase
            .channel('realtime_transactions')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => fetchTransactions()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [externalFilters, activeTab, currentPage, isCompact, refreshTrigger]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Now passing the full externalFilters object which includes dates, types, walletId, etc.
            const data = await services.transactions.getHistory(externalFilters);

            let filtered = data;

            // Simple tab filtering if date logic in repo doesn't cover activeTab explicitly
            const todayStr = new Date().toISOString().split('T')[0];
            if (activeTab === 'recentes') {
                filtered = filtered.filter(t => t.date.split('T')[0] <= todayStr);
            } else if (activeTab === 'futuros') {
                filtered = filtered.filter(t => t.date.split('T')[0] > todayStr);
            }

            // Pagination local (since getHistory currently returns all)
            const startIndex = (currentPage - 1) * pageSize;
            const paginated = limit
                ? filtered.slice(0, limit)
                : filtered.slice(startIndex, startIndex + pageSize);

            setTransactions(paginated as any);
            setTotalCount(filtered.length);
        } catch (error) {
            console.error("Erro ao carregar transações:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleTransactionClick = (transaction: TransactionWithDetails) => {
        if (onTransactionClick) {
            onTransactionClick(transaction);
        }
    };

    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.date.split('T')[0]; // Ensure just date part
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {} as Record<string, TransactionWithDetails[]>);

    const calculateDailyBalance = (transactions: TransactionWithDetails[]) => {
        return transactions.reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
    };

    const getCategoryIcon = (categoryName: string, description: string) => {
        const desc = description.toLowerCase();
        const cat = categoryName.toLowerCase();

        if (desc.includes('pix recebido') || cat.includes('receita')) {
            return <div className="p-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5"><ArrowDownRight className="h-4 w-4" /></div>;
        }

        if (desc.includes('pix enviado') || cat.includes('transferencia')) {
            return <div className="p-2 rounded-xl border border-rose-100 dark:border-rose-500/20 text-rose-500 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/5"><ArrowUpRight className="h-4 w-4" /></div>;
        }

        if (desc.includes('burger') || desc.includes('restaurante') || cat.includes('alimentacao')) {
            return <div className="p-2 rounded-xl border border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/5"><Utensils className="size-4" /></div>;
        }

        if (cat.includes('compras') || desc.includes('shpp')) {
            return <div className="p-2 rounded-xl border border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/5"><ShoppingBag className="size-4" /></div>;
        }

        if (cat.includes('servicos') || desc.includes('conveniencia') || desc.includes('mercado')) {
            return <div className="p-2 rounded-xl border border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/5"><Store className="size-4" /></div>;
        }

        return <div className="p-2 rounded-xl border border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/5"><CircleDollarSign className="size-4" strokeWidth={1.5} /></div>;
    };

    return (
        <div className="flex flex-col h-full bg-card dark:bg-[#1C1C1E]/80 rounded-card border border-border dark:border-white/10 shadow-sm overflow-hidden min-h-[400px] backdrop-blur-sm">
            <div className="flex-1 overflow-auto custom-scrollbar">
                {loading ? (
                    <div className="p-6 space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-4 w-32 rounded-full" />
                                <Skeleton className="h-20 w-full rounded-2xl" />
                            </div>
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <ListFilter className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium italic">Sem lançamentos para exibir.</p>
                    </div>
                ) : (
                    <div className="pb-4">
                        <AnimatePresence initial={false}>
                            {Object.entries(groupedTransactions).map(([date, dailyTx]) => {
                                const dailyBalance = calculateDailyBalance(dailyTx);
                                const isFuture = new Date(date) > new Date();

                                return (
                                    <div key={date} className="mb-1">
                                        <div className={cn(
                                            "px-4 py-2.5 bg-secondary/30 dark:bg-white/5 flex justify-between items-center border-y border-border/50 dark:border-white/5 sticky top-0 z-10 backdrop-blur-md",
                                            isFuture && "bg-destructive/5 dark:bg-destructive/10"
                                        )}>
                                            <h4 className={cn(
                                                "text-[12px] font-black capitalize flex items-center gap-2",
                                                isFuture ? "text-destructive" : "text-slate-900 dark:text-white"
                                            )}>
                                                {format(new Date(date + 'T00:00:00'), "d 'de' MMMM", { locale: ptBR })}
                                                {isFuture && <span className="text-[8px] uppercase tracking-wider bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">Agendado</span>}
                                            </h4>
                                            {!isFuture && (
                                                <p className="text-[11px] text-muted-foreground dark:text-slate-400 font-medium">
                                                    Saldo: {showValues ? new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                        signDisplay: 'always'
                                                    }).format(dailyBalance) : "R$ ••••"}
                                                </p>
                                            )}
                                        </div>

                                        {/* List Items */}
                                        <div className="divide-y divide-border/50">
                                            {dailyTx.map((t) => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => handleTransactionClick(t)}
                                                    className="flex items-center gap-4 px-4 py-2.5 hover:bg-secondary/20 group/item cursor-pointer transition-colors"
                                                >
                                                    <div className="flex-shrink-0">
                                                        {getCategoryIcon(t.category?.name || "Geral", t.description)}
                                                    </div>

                                                    <div className="flex-1 min-w-0 pr-2 py-0.5">
                                                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mb-0">
                                                            {t.category?.name || 'Geral'}
                                                        </span>
                                                        <h5 className={cn(
                                                            "text-[13.5px] font-black leading-tight truncate",
                                                            isFuture ? "text-destructive" : "text-slate-900 dark:text-slate-100"
                                                        )}>
                                                            {t.description}
                                                        </h5>
                                                    </div>

                                                    <div className="text-right flex flex-col items-end py-0.5">
                                                        <span className={cn(
                                                            "text-[14.5px] font-black tracking-tighter",
                                                            isFuture ? "text-destructive" : (t.type === 'income' ? "text-success" : "text-slate-900 dark:text-white")
                                                        )}>
                                                            {t.type === 'income' ? '+ ' : '- '}
                                                            {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount) : "R$ ••••"}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">
                                                            {t.wallet?.name}
                                                        </span>
                                                    </div>

                                                    <div className="flex-shrink-0 ml-2">
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </AnimatePresence>

                        {limit && transactions.length > 0 && (
                            <div className="p-4 flex justify-center border-t border-border/40 bg-card/50">
                                <Link href="/transactions">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary font-bold hover:bg-primary/5 hover:text-primary transition-all group gap-2"
                                    >
                                        <span>Ver todas as transações</span>
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && !limit && (
                    <div className="flex items-center justify-between p-6 border-t border-border bg-card sticky bottom-0 z-10">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="text-muted-foreground hover:bg-secondary"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <div className="flex flex-col items-center">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                Página {currentPage} de {Math.max(1, totalPages)}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="text-muted-foreground hover:bg-secondary"
                        >
                            Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
