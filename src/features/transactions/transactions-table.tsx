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
    Maximize2,
    Minimize2,
    ArrowLeftRight,
    ListFilter
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
    created_at?: string;
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
            const data = await services.transactions.getHistory(externalFilters);

            let filtered = data;

            const todayStr = new Date().toISOString().split('T')[0];
            if (activeTab === 'recentes') {
                filtered = filtered.filter(t => t.date.toString().split('T')[0] <= todayStr);
            } else if (activeTab === 'futuros') {
                filtered = filtered.filter(t => t.date.toString().split('T')[0] > todayStr);
            }

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

    const getCategoryIcon = (categoryName: string, description: string, type: 'income' | 'expense') => {
        const desc = description.toLowerCase();
        const cat = categoryName.toLowerCase();

        const isIncome = type === 'income';

        // Base styles for icons based on type
        const iconContainerStyles = cn(
            "flex items-center justify-center p-2.5 rounded-none border-2 transition-colors duration-300",
            isIncome
                ? "border-emerald-600/30 text-emerald-600 bg-emerald-500/10 group-hover/item:bg-emerald-500/20"
                : "border-rose-500/30 text-rose-500 bg-rose-500/10 group-hover/item:bg-rose-500/20"
        );

        const iconProps = { className: "h-4 w-4", strokeWidth: 2 };

        if (desc.includes('pix recebido') || cat.includes('receita')) {
            return <div className={iconContainerStyles}><ArrowDownRight {...iconProps} /></div>;
        }

        if (desc.includes('pix enviado') || cat.includes('transferencia')) {
            return <div className={iconContainerStyles}><ArrowUpRight {...iconProps} /></div>;
        }

        if (desc.includes('burger') || desc.includes('restaurante') || cat.includes('alimentacao')) {
            return <div className={iconContainerStyles}><Utensils {...iconProps} /></div>;
        }

        if (cat.includes('compras') || desc.includes('shpp')) {
            return <div className={iconContainerStyles}><ShoppingBag {...iconProps} /></div>;
        }

        if (cat.includes('servicos') || desc.includes('conveniencia') || desc.includes('mercado')) {
            return <div className={iconContainerStyles}><Store {...iconProps} /></div>;
        }

        return <div className={iconContainerStyles}><CircleDollarSign {...iconProps} /></div>;
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-none border border-border shadow-none transition-all duration-300 overflow-hidden min-h-[400px]">
            {/* Novo Cabeçalho Estilizado Brutalist */}
            <div className="p-5 border-b border-border bg-secondary flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-primary bg-background flex items-center justify-center text-primary">
                        <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Fluxo de Caixa</h3>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Lançamentos Recentes</p>
                    </div>
                </div>
                {!limit && (
                    <div className="px-3 py-1 bg-background border border-border text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        TOTAL: {totalCount}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {loading ? (
                    <div className="p-6 space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-4 w-32 rounded-none bg-muted" />
                                <Skeleton className="h-20 w-full rounded-none bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-[42px] h-[42px] bg-background border-2 border-border rounded-none flex items-center justify-center mx-auto mb-4">
                            <ListFilter className="h-5 w-5 text-muted-foreground stroke-[3]" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sem lançamentos para exibir.</p>
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
                                            "px-4 py-2 bg-secondary flex justify-between items-center border-y-2 border-border sticky top-0 z-10",
                                            isFuture && "bg-rose-500/10 border-rose-500/30"
                                        )}>
                                            <h4 className={cn(
                                                "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                                                isFuture ? "text-rose-500" : "text-foreground"
                                            )}>
                                                {format(new Date(date + 'T00:00:00'), "d 'de' MMMM", { locale: ptBR })}
                                                {isFuture && <span className="text-[8px] uppercase tracking-widest bg-rose-500/20 text-rose-500 px-2 py-1 border border-current rounded-none">Agendado</span>}
                                            </h4>
                                            {!isFuture && (
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    Saldo: {showValues ? new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                        signDisplay: 'always'
                                                    }).format(dailyBalance) : "R$ ••••"}
                                                </p>
                                            )}
                                        </div>

                                        <div className="divide-y divide-border">
                                            {dailyTx.map((t) => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => handleTransactionClick(t)}
                                                    className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/40 group/item cursor-pointer transition-colors"
                                                >
                                                    <div className="flex-shrink-0">
                                                        {getCategoryIcon(t.category?.name || "Geral", t.description, t.type)}
                                                    </div>

                                                    <div className="flex-1 min-w-0 pr-2 py-0.5">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                                                {t.category?.name || 'Geral'}
                                                            </span>
                                                            <span className="text-muted-foreground/50 mx-1">/</span>
                                                            <span className="text-[9px] text-muted-foreground font-black opacity-60">
                                                                {t.created_at ? format(new Date(t.created_at), "HH:mm") : format(new Date(t.date + 'T12:00:00'), "HH:mm")}
                                                            </span>
                                                        </div>
                                                        <h5 className={cn(
                                                            "text-[11px] uppercase tracking-widest font-black leading-tight truncate mt-1",
                                                            isFuture ? "text-destructive" : "text-foreground"
                                                        )}>
                                                            {t.description}
                                                        </h5>
                                                    </div>

                                                    <div className="text-right flex flex-col items-end py-0.5">
                                                        <span className={cn(
                                                            "text-[14.5px] font-bold tracking-tighter",
                                                            isFuture ? "text-destructive" : (t.type === 'income' ? "text-emerald-500" : "text-slate-900 dark:text-white")
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
                            <div className="p-4 flex justify-center border-t border-border/40 bg-white/30 dark:bg-white/5">
                                <Link href="/transactions">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 hover:text-primary transition-all group gap-2 rounded-none border border-transparent hover:border-border h-[42px]"
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
                            className="text-muted-foreground hover:bg-secondary rounded-none font-black uppercase tracking-widest text-[10px] h-[42px]"
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
                            className="text-muted-foreground hover:bg-secondary rounded-none font-black uppercase tracking-widest text-[10px] h-[42px]"
                        >
                            Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// aria-label
