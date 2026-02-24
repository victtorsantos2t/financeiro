"use client";

import { TransactionsTable } from "./transactions-table";
import { Download, Filter, Eye } from "lucide-react";
import { IOSPageHeader } from "@/components/layout/ios-page-header";
import { motion, AnimatePresence } from "framer-motion";
import { ExportStatementScreen } from "./export-statement-screen";
import { TransactionFiltersDrawer } from "./transaction-filters-drawer";
import { TransactionDetailsScreen } from "./transaction-details-screen";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function TransactionsView() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // States moved to SearchParams where possible
    const view = searchParams.get('v') as 'list' | 'export' | 'details' || 'list';
    const activeTab = searchParams.get('tab') as 'recentes' | 'futuros' || 'recentes';

    // Other local interaction states
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<any>({});
    const [showValues, setShowValues] = useState(true);

    const updateQuery = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`?${params.toString()}`);
    };

    if (view === 'export') {
        return (
            <ExportStatementScreen
                onBack={() => updateQuery('v', null)}
                onExportComplete={() => updateQuery('v', null)}
            />
        );
    }

    if (view === 'details' && selectedTransaction) {
        return (
            <TransactionDetailsScreen
                transaction={selectedTransaction}
                onBack={() => {
                    updateQuery('v', null);
                    setSelectedTransaction(null);
                }}
                showValues={showValues}
            />
        );
    }

    return (
        <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
            <IOSPageHeader
                title="Lançamentos"
                subtitle="Gestão de transações"
                showBack
                onBack={() => router.push('/dashboard')}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowValues(!showValues)}
                            className="p-2 text-foreground hover:bg-secondary rounded-none border border-transparent hover:border-border transition-all active:scale-95"
                        >
                            {showValues ? <Eye className="h-5 w-5" /> : <Eye className="h-5 w-5 text-muted-foreground/30" />}
                        </button>
                        <button
                            onClick={() => updateQuery('v', 'export')}
                            className="p-2 text-foreground hover:bg-secondary rounded-none border border-transparent hover:border-border active:scale-95 transition-all"
                        >
                            <Download className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="p-2 text-foreground hover:bg-secondary rounded-none border border-transparent hover:border-border active:scale-95 transition-all"
                        >
                            <Filter className="h-5 w-5" />
                        </button>
                    </div>
                }
            />

            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center bg-card p-6 rounded-none border-2 border-border shadow-none transition-all duration-300">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">Histórico de Transações</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acompanhe todas as suas receitas e despesas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowValues(!showValues)}
                        className="flex items-center justify-center h-[42px] w-[42px] text-foreground bg-transparent border-2 border-border hover:bg-secondary rounded-none transition-all active:scale-95"
                        title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
                    >
                        {showValues ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4 text-muted-foreground/30" />}
                    </button>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center justify-center h-[42px] w-[42px] text-foreground bg-transparent border-2 border-border hover:bg-secondary rounded-none transition-all active:scale-95"
                        title="Filtros"
                    >
                        <Filter className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => updateQuery('v', 'export')}
                        className="flex items-center gap-2 h-[42px] px-6 text-primary-foreground bg-primary hover:bg-primary/90 border border-primary rounded-none font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                    >
                        <Download className="h-4 w-4 stroke-[3]" />
                        <span>Exportar Extrato</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className="flex border-b border-border">
                    {['recentes', 'futuros'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => updateQuery('tab', tab)}
                            className="relative px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all"
                            style={{ color: activeTab === tab ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-none"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <main className="flex-1 mt-6">
                <TransactionsTable
                    externalFilters={filters}
                    activeTab={activeTab as any}
                    showValues={showValues}
                    onTransactionClick={(tx) => {
                        setSelectedTransaction(tx);
                        updateQuery('v', 'details');
                    }}
                />
            </main>

            {/* Filters Drawer */}
            <TransactionFiltersDrawer
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                onApply={(appliedFilters) => {
                    setFilters(appliedFilters);
                }}
            />
        </div>
    );
}

// aria-label
