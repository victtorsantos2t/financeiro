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
}

export function TransactionsTable({
    defaultCompact = false,
    externalFilters,
    activeTab = 'recentes',
    showValues = true,
    onTransactionClick
}: TransactionsTableProps) {
    const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCompact, setIsCompact] = useState(defaultCompact);
    // Remove local filters state and use props

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = isCompact ? 10 : 10;

    const supabase = createClient();
    const { refreshTrigger } = useDashboard();

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
            const data = await services.transactions.getHistory(externalFilters?.walletId);

            // Simulação de filtragem externa para manter compatibilidade com o drawer antigo
            // Idealmente, o TransactionService deveria aceitar todos os filtros
            let filtered = data;
            if (externalFilters) {
                if (externalFilters.types && externalFilters.types.length > 0) {
                    filtered = filtered.filter(t => externalFilters.types.includes(t.type));
                }
                if (externalFilters.startDate) {
                    filtered = filtered.filter(t => t.date >= externalFilters.startDate);
                }
                if (externalFilters.endDate) {
                    filtered = filtered.filter(t => t.date <= externalFilters.endDate);
                }
            }

            setTransactions(filtered as any);
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
            return <div className="p-2.5 rounded-xl border border-emerald-100 text-emerald-600"><ArrowDownRight className="h-5 w-5" /></div>;
        }

        if (desc.includes('pix enviado') || cat.includes('transferencia')) {
            return <div className="p-2.5 rounded-xl border border-rose-100 text-rose-500"><ArrowUpRight className="h-5 w-5" /></div>;
        }

        if (desc.includes('burger') || desc.includes('restaurante') || cat.includes('alimentacao')) {
            return <div className="p-2.5 rounded-xl border border-slate-100 text-slate-400"><Utensils className="size-5" /></div>;
        }

        if (cat.includes('compras') || desc.includes('shpp')) {
            return <div className="p-2.5 rounded-xl border border-slate-100 text-slate-400"><ShoppingBag className="size-5" /></div>;
        }

        if (cat.includes('servicos') || desc.includes('conveniencia') || desc.includes('mercado')) {
            return <div className="p-2.5 rounded-xl border border-slate-100 text-slate-400"><Store className="size-5" /></div>;
        }

        return <div className="p-2.5 rounded-xl border border-slate-100 text-slate-400"><CircleDollarSign className="size-5" strokeWidth={1.5} /></div>;
    };

    return (
        <div className="flex flex-col h-full bg-white min-h-[500px]">
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
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ListFilter className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium italic">Sem lançamentos para exibir.</p>
                    </div>
                ) : (
                    <div className="pb-24">
                        <AnimatePresence initial={false}>
                            {Object.entries(groupedTransactions).map(([date, dailyTx]) => {
                                const dailyBalance = calculateDailyBalance(dailyTx);
                                const isFuture = new Date(date) > new Date();

                                return (
                                    <div key={date} className="px-6 mb-8">
                                        {/* Date Header */}
                                        <div className="py-6 border-b border-slate-100/50">
                                            <h4 className="text-base font-bold text-slate-900 mb-1 capitalize">
                                                {format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                            </h4>
                                            {!isFuture && (
                                                <p className="text-sm text-slate-500 font-medium">
                                                    Saldo do dia: {showValues ? new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                        signDisplay: 'always'
                                                    }).format(dailyBalance) : "R$ ••••"}
                                                </p>
                                            )}
                                        </div>

                                        {/* List Items */}
                                        <div className="space-y-0">
                                            {dailyTx.map((t) => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => handleTransactionClick(t)}
                                                    className="flex items-center gap-5 py-6 border-b border-slate-50 last:border-none group/item cursor-pointer active:bg-slate-50/50 transition-colors"
                                                >
                                                    <div className="flex-shrink-0">
                                                        {getCategoryIcon(t.category?.name || "Geral", t.description)}
                                                    </div>

                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <span className="text-xs text-slate-400 font-medium block mb-1">
                                                            {t.type === 'income' ? 'Pix recebido' : 'Transferência enviada'}
                                                        </span>
                                                        <h5 className="text-[15px] font-bold text-slate-900 leading-tight truncate mb-1">
                                                            {t.description}
                                                        </h5>
                                                        <span className={cn(
                                                            "text-[15px] font-medium tracking-tight",
                                                            t.type === 'income' ? "text-emerald-600" : "text-slate-500"
                                                        )}>
                                                            {t.type === 'income' ? '' : '- '}
                                                            {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount) : "R$ ••••"}
                                                        </span>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover/item:text-slate-900 transition-colors" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-white sticky bottom-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-slate-500"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Página {currentPage} de {Math.max(1, totalPages)}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="text-slate-500"
                    >
                        Próxima <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}

        </div>
    );
}
