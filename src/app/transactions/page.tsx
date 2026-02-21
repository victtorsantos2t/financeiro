"use client";

import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Filter, Search, Eye } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExportStatementScreen } from "@/components/dashboard/export-statement-screen";
import { TransactionFiltersDrawer } from "@/components/dashboard/transaction-filters-drawer";
import { TransactionDetailsScreen } from "@/components/dashboard/transaction-details-screen";
import { useRouter } from "next/navigation";

export default function TransactionsPage() {
    const router = useRouter();
    const [view, setView] = useState<'list' | 'export' | 'details'>('list');
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'recentes' | 'futuros'>('recentes');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<any>({});
    const [showValues, setShowValues] = useState(true);

    if (view === 'export') {
        return (
            <ExportStatementScreen
                onBack={() => setView('list')}
                onExportComplete={() => setView('list')}
            />
        );
    }

    if (view === 'details' && selectedTransaction) {
        return (
            <TransactionDetailsScreen
                transaction={selectedTransaction}
                onBack={() => {
                    setView('list');
                    setSelectedTransaction(null);
                }}
                showValues={showValues}
            />
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="max-w-5xl mx-auto w-full flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-background pt-4">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-xl transition-all active:scale-95"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        <button
                            onClick={() => setShowValues(!showValues)}
                            className="p-2 text-foreground hover:bg-secondary rounded-xl transition-all active:scale-95"
                        >
                            {showValues ? <Eye className="h-6 w-6" /> : <Eye className="h-6 w-6 text-muted-foreground/30" />}
                        </button>
                    </div>

                    <div className="px-6 pb-2">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Lançamentos</h1>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setView('list')}
                                    className="p-3 bg-card border border-border rounded-xl text-foreground active:scale-95 transition-all hover:bg-secondary shadow-sm"
                                >
                                    <Download className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className="p-3 bg-card border border-border rounded-xl text-foreground active:scale-95 transition-all hover:bg-secondary shadow-sm"
                                >
                                    <Filter className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-border">
                            {['recentes', 'futuros'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className="relative px-6 py-4 text-sm font-bold capitalize transition-all"
                                    style={{ color: activeTab === tab ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* List */}
                <main className="flex-1">
                    <TransactionsTable
                        externalFilters={filters}
                        activeTab={activeTab}
                        showValues={showValues}
                        onTransactionClick={(tx) => {
                            setSelectedTransaction(tx);
                            setView('details');
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
        </div>
    );
}
