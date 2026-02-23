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
        <div className="flex flex-col min-h-screen bg-background">
            <div className="max-w-5xl mx-auto w-full flex flex-col min-h-screen">
                <IOSPageHeader
                    title="Lançamentos"
                    subtitle="Gestão de transações"
                    showBack
                    onBack={() => router.push('/dashboard')}
                    action={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowValues(!showValues)}
                                className="p-2 text-foreground hover:bg-secondary rounded-xl transition-all active:scale-95"
                            >
                                {showValues ? <Eye className="h-5 w-5" /> : <Eye className="h-5 w-5 text-muted-foreground/30" />}
                            </button>
                            <button
                                onClick={() => updateQuery('v', 'export')}
                                className="p-2 text-foreground hover:bg-secondary rounded-xl active:scale-95 transition-all"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="p-2 text-foreground hover:bg-secondary rounded-xl active:scale-95 transition-all"
                            >
                                <Filter className="h-5 w-5" />
                            </button>
                        </div>
                    }
                />

                {/* Tabs — Agora com margem padronizada */}
                <div className="px-4 mt-2">
                    <div className="flex border-b border-border">
                        {['recentes', 'futuros'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => updateQuery('tab', tab)}
                                className="relative px-6 py-3 text-sm font-bold capitalize transition-all"
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

                {/* List */}
                <main className="flex-1 px-4 mt-6">
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
        </div>
    );
}
