"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";

import { useWidgetStore } from "@/core/application/store/widget-store";
import { SortableWidget } from "@/components/dashboard/widgets/sortable-widget";

// Widgets atuais transformados em componentes mapeáveis
import { Wallet } from "@/components/dashboard/wallet";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { MonthlyEarningsChart } from "@/components/dashboard/monthly-earnings-chart";
import { EarningsDonut } from "@/components/dashboard/earnings-donut";
import { useDashboard } from "@/context/dashboard-context";
import { FinancialHealthScorecard } from "@/components/dashboard/financial-health-scorecard";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { ImportTransactionsModal } from "@/components/dashboard/import-transactions-modal";
import { PayableAccounts } from "@/components/dashboard/payable-accounts";
import { CashFlowForecast } from "@/components/dashboard/cash-flow-forecast";
import { CreditCard } from "@/components/dashboard/credit-card";
import { createClient } from "@/lib/supabase/client";
import { services } from "@/core/application/services/services.factory";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

export default function DraggableDashboard() {
    const { layout, setLayout } = useWidgetStore();
    const { currentDate } = useDashboard();
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Evita hydration mismatch
    useEffect(() => { setMounted(true); }, []);

    // Detecta mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Trigger Daily Yield Update
    useEffect(() => {
        const updateYields = async () => {
            const supabase = createClient();
            try {
                const { error } = await supabase.rpc('calculate_wallet_yields');
                if (error) console.error("Error updating yields:", error);
            } catch (err) {
                console.error("Failed to update yields:", err);
            }
        };
        updateYields();
    }, []);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = layout.indexOf(active.id);
            const newIndex = layout.indexOf(over.id);
            setLayout(arrayMove(layout, oldIndex, newIndex));
        }
    };

    if (!mounted) return <div className="p-8 text-center text-slate-400">Carregando Dashboard...</div>;

    const renderWidget = (id: string) => {
        switch (id) {
            case 'wallet-summary': return <Wallet />;
            case 'financial-health': return <FinancialHealthScorecard />;
            case 'transactions-table': return <TransactionsTable />;
            case 'monthly-chart': return <MonthlyEarningsChart currentDate={currentDate} />;
            case 'earnings-donut': return <EarningsDonut currentDate={currentDate} />;
            case 'payable-accounts': return <PayableAccounts />;
            case 'cash-flow-forecast': return <CashFlowForecast />;
            case 'credit-card':
                // CreditCard component requires wallet prop
                // For now, we'll render null - user should add this via the full dashboard
                return null;
            default: return null;
        }
    };

    // Versão Mobile (sem drag & drop)
    if (isMobile) {
        return (
            <div className="space-y-6 max-w-[1440px] mx-auto pb-24 px-4">
                <div className="flex flex-col gap-1 px-0">
                    <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Visão Geral</h1>
                    <p className="text-sm font-medium text-slate-400">Desempenho financeiro consolidado.</p>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2">
                    <ImportTransactionsModal />
                    <AddTransactionModal />
                </div>

                <div className="flex flex-col gap-6">
                    {layout.filter(id => renderWidget(id) !== null).map((id) => (
                        <div key={id}>
                            {renderWidget(id)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1440px] mx-auto pb-12 px-2 md:px-0">
            {/* Header com Ações */}
            <div className="flex flex-col gap-1 md:flex-row md:items-end justify-between px-2">
                <div>
                    <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">Visão Geral</h1>
                    <p className="text-sm font-medium text-slate-400 tracking-wide">Desempenho financeiro consolidado.</p>
                </div>
                <div className="hidden md:flex gap-3">
                    <ImportTransactionsModal />
                    <AddTransactionModal />
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={layout} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {layout.map((id) => (
                            <div key={id} className={id === 'transactions-table' ? 'md:col-span-2 lg:col-span-3' : ''}>
                                <SortableWidget id={id} className="h-full relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-grab z-10 p-1 bg-white/80 rounded-md backdrop-blur-sm transition-opacity">
                                        <GripVertical className="w-4 h-4 text-slate-400" />
                                    </div>
                                    {renderWidget(id)}
                                </SortableWidget>
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
