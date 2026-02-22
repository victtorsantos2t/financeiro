"use client";

import { useState, useEffect } from "react";
import {
    Filter,
    X,
    Check,
    ChevronDown,
    Wallet as WalletIcon,
    Tag,
    Clock,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FilterState {
    wallets: string[];
    categories: string[];
    status: string[];
}

interface AdvancedFiltersProps {
    onFilterChange: (filters: FilterState) => void;
}

export function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const [filters, setFilters] = useState<FilterState>({
        wallets: [],
        categories: [],
        status: []
    });
    const [options, setOptions] = useState<{ wallets: any[], categories: any[] }>({
        wallets: [],
        categories: []
    });

    const supabase = createClient();

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        onFilterChange(filters);
    }, [filters]);

    const fetchOptions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [walletsRes, categoriesRes] = await Promise.all([
            supabase.from("wallets").select("id, name").eq("user_id", user.id),
            supabase.from("categories").select("id, name").eq("user_id", user.id)
        ]);

        setOptions({
            wallets: walletsRes.data || [],
            categories: categoriesRes.data || []
        });
    };

    const toggleFilter = (type: keyof FilterState, id: string) => {
        setFilters(prev => {
            const current = prev[type];
            const next = current.includes(id)
                ? current.filter(item => item !== id)
                : [...current, id];
            return { ...prev, [type]: next };
        });
    };

    const clearFilters = () => {
        setFilters({ wallets: [], categories: [], status: [] });
    };

    const activeCount = filters.wallets.length + filters.categories.length + filters.status.length;

    const Trigger = (
        <Button
            variant="outline"
            size="sm"
            className={cn(
                "h-9 px-4 rounded-xl border-slate-100 text-slate-500 hover:text-slate-900 transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] bg-white flex items-center gap-2",
                activeCount > 0 && "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            )}
        >
            <Filter className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold tracking-wide">Filtros</span>
            {activeCount > 0 && (
                <span className="flex items-center justify-center bg-primary text-white text-[9px] font-bold h-4 w-4 rounded-full ml-0.5 animate-in zoom-in-50 duration-300">
                    {activeCount}
                </span>
            )}
            <ChevronDown className={cn("h-3 w-3 opacity-40 transition-transform duration-300", open && "rotate-180")} />
        </Button>
    );

    const Content = (
        <div className="flex flex-col h-full max-h-[80vh]">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-slate-900">Filtrar Transações</h4>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">Ajuste sua visualização</p>
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest"
                    >
                        Limpar
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-8 custom-scrollbar">
                {/* Wallets */}
                <div className="px-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Carteiras
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {options.wallets.map(w => (
                            <button
                                key={w.id}
                                onClick={() => toggleFilter('wallets', w.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-300",
                                    filters.wallets.includes(w.id)
                                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                {w.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div className="px-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Categorias
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {options.categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => toggleFilter('categories', c.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-300",
                                    filters.categories.includes(c.id)
                                        ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="px-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'completed', label: 'Efetivado', icon: CheckCircle2 },
                            { id: 'pending', label: 'Planejado', icon: Clock }
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => toggleFilter('status', s.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-300 flex items-center gap-2",
                                    filters.status.includes(s.id)
                                        ? "bg-brand-primary border-primary text-white"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <s.icon className="h-3 w-3" />
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-slate-50/50 mt-auto border-t border-slate-100">
                <Button
                    onClick={() => setOpen(false)}
                    className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12 shadow-lg shadow-slate-200"
                >
                    Aplicar Filtros
                </Button>
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {Trigger}
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0 rounded-3xl border-slate-100 shadow-2xl" align="end">
                    {Content}
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {Trigger}
            </DrawerTrigger>
            <DrawerContent className="rounded-t-3xl border-none">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>Filtros Avançados</DrawerTitle>
                </DrawerHeader>
                {Content}
            </DrawerContent>
        </Drawer>
    );
}
