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
                "h-[42px] px-4 rounded-none border-2 border-border text-foreground hover:bg-secondary bg-background transition-all shadow-none flex items-center gap-2",
                activeCount > 0 && "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
            )}
        >
            <Filter className={cn("h-4 w-4 stroke-[3]", activeCount > 0 ? "text-primary-foreground" : "text-foreground")} />
            <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
            {activeCount > 0 && (
                <span className="flex items-center justify-center bg-background text-primary text-[10px] font-black h-5 w-5 rounded-none border-2 border-border ml-1 animate-in zoom-in-50 duration-300">
                    {activeCount}
                </span>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300 stroke-[3]", open && "rotate-180")} />
        </Button>
    );

    const Content = (
        <div className="flex flex-col h-full max-h-[80vh] bg-card text-foreground">
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Filtrar Transações</h4>
                    <p className="text-[8px] text-muted-foreground font-bold tracking-widest uppercase mt-0.5">Ajuste sua visualização</p>
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-[10px] font-black text-muted-foreground hover:text-foreground border border-transparent hover:border-border px-2 py-1 transition-all uppercase tracking-widest"
                    >
                        Limpar
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-8 custom-scrollbar">
                {/* Wallets */}
                <div className="px-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        Carteiras
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {options.wallets.map(w => (
                            <button
                                key={w.id}
                                onClick={() => toggleFilter('wallets', w.id)}
                                className={cn(
                                    "px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300",
                                    filters.wallets.includes(w.id)
                                        ? "bg-primary border-primary text-primary-foreground shadow-none"
                                        : "bg-transparent border-border text-foreground hover:border-primary/50"
                                )}
                            >
                                {w.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div className="px-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        Categorias
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {options.categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => toggleFilter('categories', c.id)}
                                className={cn(
                                    "px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300",
                                    filters.categories.includes(c.id)
                                        ? "bg-primary border-primary text-primary-foreground shadow-none"
                                        : "bg-transparent border-border text-foreground hover:border-primary/50"
                                )}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="px-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
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
                                    "px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300 flex items-center gap-2",
                                    filters.status.includes(s.id)
                                        ? "bg-primary border-primary text-primary-foreground shadow-none"
                                        : "bg-transparent border-border text-foreground hover:border-primary/50"
                                )}
                            >
                                <s.icon className="h-3 w-3 stroke-[3]" />
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-card mt-auto border-t border-border">
                <Button
                    onClick={() => setOpen(false)}
                    className="w-full rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-[42px] shadow-none border border-primary transition-all"
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
                <PopoverContent className="w-[360px] p-0 rounded-none border-2 border-border shadow-none bg-card" align="end">
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
            <DrawerContent className="rounded-none border-t-2 border-border bg-card">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>Filtros Avançados</DrawerTitle>
                </DrawerHeader>
                {Content}
            </DrawerContent>
        </Drawer>
    );
}

// aria-label
