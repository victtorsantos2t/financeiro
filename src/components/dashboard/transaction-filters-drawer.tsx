"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { X, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TransactionFiltersDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApply: (filters: any) => void;
}

export function TransactionFiltersDrawer({ open, onOpenChange, onApply }: TransactionFiltersDrawerProps) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [types, setTypes] = useState<string[]>(["income", "expense"]);
    const [sortOrder, setSortOrder] = useState("desc");

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        setTypes(["income", "expense"]);
        setSortOrder("desc");
    };

    const toggleType = (type: string) => {
        setTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[110]" />
                <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] h-[92vh] mt-24 fixed bottom-0 left-0 right-0 z-[120] outline-none">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 mt-4 mb-4" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pb-6 border-b border-slate-50">
                        <h2 className="text-xl font-bold text-slate-900">Filtros</h2>
                        <button onClick={() => onOpenChange(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-10">
                        {/* Period Selection */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Personalizar período</h3>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                    Para consultar lançamentos anteriores a 2023, acesse sua conta pelo computador.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Data inicial</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl h-14 px-12 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Data final</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl h-14 px-12 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flow Type */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Tipo de lançamento</h3>
                            <div className="space-y-0">
                                <div
                                    onClick={() => toggleType("income")}
                                    className="flex items-center justify-between py-4 border-b border-slate-100 cursor-pointer"
                                >
                                    <div>
                                        <span className="text-base font-medium text-slate-900 block">Entradas</span>
                                        <span className="text-xs text-slate-400 font-bold">Padrão</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                                        types.includes("income") ? "bg-slate-900 border-slate-900" : "border-slate-200"
                                    )}>
                                        {types.includes("income") && <X className="h-4 w-4 text-white" />}
                                    </div>
                                </div>
                                <div
                                    onClick={() => toggleType("expense")}
                                    className="flex items-center justify-between py-4 border-b border-slate-100 cursor-pointer"
                                >
                                    <div>
                                        <span className="text-base font-medium text-slate-900 block">Saídas</span>
                                        <span className="text-xs text-slate-400 font-bold">Padrão</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                                        types.includes("expense") ? "bg-slate-900 border-slate-900" : "border-slate-200"
                                    )}>
                                        {types.includes("expense") && <X className="h-4 w-4 text-white" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Ordem de exibição</h3>
                            <div className="space-y-0 text-slate-900">
                                <div
                                    onClick={() => setSortOrder("desc")}
                                    className="flex items-center justify-between py-4 border-b border-slate-100 cursor-pointer"
                                >
                                    <div>
                                        <span className="text-base font-medium block">Mais recentes primeiro</span>
                                        <span className="text-xs text-slate-400 font-bold">Padrão</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                        sortOrder === "desc" ? "border-slate-900" : "border-slate-200"
                                    )}>
                                        {sortOrder === "desc" && <div className="w-3 h-3 rounded-full bg-slate-900" />}
                                    </div>
                                </div>
                                <div
                                    onClick={() => setSortOrder("asc")}
                                    className="flex items-center justify-between py-4 border-b border-slate-100 cursor-pointer"
                                >
                                    <div>
                                        <span className="text-base font-medium block">Mais antigos primeiro</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                        sortOrder === "asc" ? "border-slate-900" : "border-slate-200"
                                    )}>
                                        {sortOrder === "asc" && <div className="w-3 h-3 rounded-full bg-slate-900" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="p-6 border-t border-slate-50 bg-white grid grid-cols-2 gap-4 pb-safe-bottom">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="h-14 rounded-2xl border-slate-200 text-slate-400 font-bold text-base hover:bg-slate-50 active:scale-95 transition-all"
                        >
                            Redefinir
                        </Button>
                        <Button
                            onClick={() => {
                                onApply({ startDate, endDate, types, sortOrder });
                                onOpenChange(false);
                            }}
                            className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base active:scale-95 transition-all shadow-lg shadow-slate-100"
                        >
                            Filtrar
                        </Button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
