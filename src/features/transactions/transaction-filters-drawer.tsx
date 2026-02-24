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
                <Drawer.Overlay className="fixed inset-0 bg-black/80 z-[110] backdrop-blur-sm" />
                <Drawer.Content className="bg-card flex flex-col rounded-none border-t-2 border-border h-[92vh] mt-24 fixed bottom-0 left-0 right-0 z-[120] outline-none">
                    {/* Título oculto para acessibilidade (obrigatório pelo Radix/vaul) */}
                    <Drawer.Title className="sr-only">Filtros de Transações</Drawer.Title>
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 bg-muted mt-4 mb-4" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pb-6 border-b border-border">
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Filtros</h2>
                        <button onClick={() => onOpenChange(false)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-6 w-6 stroke-[3]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-10">
                        {/* Period Selection */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Personalizar período</h3>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-2 leading-relaxed">
                                    Para consultar lançamentos anteriores a 2023, acesse sua conta pelo computador.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data inicial</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-transparent border-2 border-border rounded-none h-[42px] px-12 text-[10px] font-black uppercase tracking-widest text-foreground focus:ring-0 focus:border-primary transition-all appearance-none cursor-pointer"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data final</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-transparent border-2 border-border rounded-none h-[42px] px-12 text-[10px] font-black uppercase tracking-widest text-foreground focus:ring-0 focus:border-primary transition-all appearance-none cursor-pointer"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flow Type */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Tipo de lançamento</h3>
                            <div className="space-y-0">
                                <div
                                    onClick={() => toggleType("income")}
                                    className="flex items-center justify-between py-4 border-b border-border cursor-pointer group"
                                >
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground block group-hover:text-primary transition-colors">Entradas</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-1 block">Padrão</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-none border-2 flex items-center justify-center transition-all",
                                        types.includes("income") ? "bg-primary border-primary" : "border-border bg-transparent group-hover:border-primary"
                                    )}>
                                        {types.includes("income") && <X className="h-4 w-4 text-primary-foreground stroke-[3]" />}
                                    </div>
                                </div>
                                <div
                                    onClick={() => toggleType("expense")}
                                    className="flex items-center justify-between py-4 border-b border-border cursor-pointer group"
                                >
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground block group-hover:text-primary transition-colors">Saídas</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-1 block">Padrão</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-none border-2 flex items-center justify-center transition-all",
                                        types.includes("expense") ? "bg-primary border-primary" : "border-border bg-transparent group-hover:border-primary"
                                    )}>
                                        {types.includes("expense") && <X className="h-4 w-4 text-primary-foreground stroke-[3]" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Ordem de exibição</h3>
                            <div className="space-y-0 text-foreground">
                                <div
                                    onClick={() => setSortOrder("desc")}
                                    className="flex items-center justify-between py-4 border-b border-border cursor-pointer group"
                                >
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground block group-hover:text-primary transition-colors">Mais recentes primeiro</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-1 block">Padrão</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-none border-2 flex items-center justify-center transition-all",
                                        sortOrder === "desc" ? "bg-primary border-primary" : "border-border bg-transparent group-hover:border-primary"
                                    )}>
                                        {sortOrder === "desc" && <X className="h-4 w-4 text-primary-foreground stroke-[3]" />}
                                    </div>
                                </div>
                                <div
                                    onClick={() => setSortOrder("asc")}
                                    className="flex items-center justify-between py-4 border-b border-border cursor-pointer group"
                                >
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground block group-hover:text-primary transition-colors">Mais antigos primeiro</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-none border-2 flex items-center justify-center transition-all",
                                        sortOrder === "asc" ? "bg-primary border-primary" : "border-border bg-transparent group-hover:border-primary"
                                    )}>
                                        {sortOrder === "asc" && <X className="h-4 w-4 text-primary-foreground stroke-[3]" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="p-6 border-t border-border bg-card grid grid-cols-2 gap-4 pb-safe-bottom">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="h-[42px] rounded-none border-2 border-border text-foreground font-black uppercase tracking-widest text-[10px] hover:bg-secondary active:scale-95 transition-all"
                        >
                            Redefinir
                        </Button>
                        <Button
                            onClick={() => {
                                onApply({ startDate, endDate, types, sortOrder });
                                onOpenChange(false);
                            }}
                            className="h-[42px] rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-none border border-primary"
                        >
                            Filtrar
                        </Button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}

// aria-label
