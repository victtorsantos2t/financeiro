"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { CategoryService } from "@/services/category.service";
import { Plus, Trash2, RefreshCw, Tag, ArrowUpCircle, ArrowDownCircle, Search, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Category = {
    id: string;
    name: string;
    type: "income" | "expense";
};

const DEFAULT_CATEGORIES = [
    { name: "Alimentação", type: "expense" },
    { name: "Transporte", type: "expense" },
    { name: "Moradia", type: "expense" },
    { name: "Lazer", type: "expense" },
    { name: "Saúde", type: "expense" },
    { name: "Educação", type: "expense" },
    { name: "Salário", type: "income" },
    { name: "Freelance", type: "income" },
    { name: "Investimentos", type: "income" },
    { name: "Presentes", type: "income" },
];

export function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewFilter, setViewFilter] = useState<"all" | "income" | "expense">("all");
    const supabase = createClient();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await CategoryService.list();
            setCategories(data);
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        }
    };

    const displayedCategories = categories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = viewFilter === 'all' || cat.type === viewFilter;
        return matchesSearch && matchesFilter;
    });

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase.from("categories").insert([
                {
                    user_id: user.id,
                    name: newCategoryName,
                    type: newCategoryType,
                    icon: "circle", // Default icon
                    color: "#000000" // Default color
                }
            ]);

            if (error) {
                toast.error("Erro ao adicionar categoria");
            } else {
                setNewCategoryName("");
                fetchCategories();
                toast.success("Categoria adicionada!");
            }
        }
        setLoading(false);
    };

    const handleDeleteCategory = async (id: string) => {
        // Optimistic update
        const categoryToRemove = categories.find(c => c.id === id);
        setCategories(prev => prev.filter(c => c.id !== id));

        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) {
            // Rollback if error
            if (categoryToRemove) {
                setCategories(prev => [...prev, categoryToRemove].sort((a, b) => a.name.localeCompare(b.name)));
            }
            toast.error("Erro ao excluir", {
                description: "Pode haver transações vinculadas a esta categoria. Tente excluir as transações primeiro."
            });
        } else {
            toast.success("Categoria removida.");
        }
    };

    const handleLoadDefaults = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
                user_id: user.id,
                name: cat.name,
                type: cat.type,
                icon: "circle",
                color: "#000000"
            }));

            const { error } = await supabase.from("categories").insert(categoriesToInsert);

            if (error) {
                toast.error("Erro ao carregar padrões.");
            } else {
                fetchCategories();
                toast.success("Padrões carregados com sucesso!");
            }
        }
        setLoading(false);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* 1. ADD NEW CATEGORY SECTION */}
            <div className="bg-card dark:bg-white/5 rounded-[32px] p-8 border border-border shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary text-primary-foreground rounded-[18px]">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-xl font-bold text-foreground tracking-tight">Nova Categoria</h3>
                            <p className="text-muted-foreground text-sm font-medium">Organize seus lançamentos por tipo.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="space-y-4 w-full flex-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">
                            Identificação da Categoria
                        </Label>
                        <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Ex: Viagens, Assinaturas..."
                            className="h-16 rounded-[22px] bg-secondary/50 border-transparent focus:bg-background focus:border-primary focus:ring-0 transition-all font-semibold text-foreground px-8 text-base shadow-inner group hover:border-border"
                        />
                    </div>

                    <div className="space-y-4 w-full lg:w-[220px]">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">
                            Fluxo Financeiro
                        </Label>
                        <Select
                            value={newCategoryType}
                            onValueChange={(val: "income" | "expense") => setNewCategoryType(val)}
                        >
                            <SelectTrigger className="h-16 rounded-[22px] bg-secondary/50 border-transparent transition-all font-bold text-foreground px-8 text-base focus:bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-[28px] border-border shadow-2xl p-2 bg-popover/98 backdrop-blur-xl">
                                <SelectItem value="expense" className="rounded-xl py-4 focus:bg-secondary font-semibold text-foreground flex items-center gap-2">
                                    Despesa
                                </SelectItem>
                                <SelectItem value="income" className="rounded-xl py-4 focus:bg-secondary font-semibold text-foreground flex items-center gap-2">
                                    Receita
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleAddCategory}
                        disabled={loading || !newCategoryName.trim()}
                        className="h-16 px-10 rounded-[22px] bg-foreground text-background font-bold shadow-xl shadow-foreground/10 hover:shadow-foreground/20 active:scale-95 transition-all text-base w-full lg:w-auto"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* 2. EXISTING CATEGORIES LIST */}
            <div className="bg-card dark:bg-white/5 rounded-[32px] p-8 border border-border shadow-sm space-y-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-foreground tracking-tight">Categorias Ativas</h3>
                            <p className="text-muted-foreground text-sm font-medium">Lista organizada dos seus tipos de lançamento.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group flex-1 sm:w-64">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-foreground transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-border focus:ring-4 focus:ring-primary/10 transition-all pl-14 pr-6 text-sm font-semibold text-foreground outline-none"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleLoadDefaults}
                                disabled={loading}
                                className="h-12 w-12 rounded-full bg-secondary border-transparent hover:bg-primary/20 hover:text-primary transition-all shrink-0 p-0"
                                title="Carregar Padrões"
                            >
                                <Sparkles className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 p-1.5 bg-secondary/50 rounded-2xl w-fit">
                        {[
                            { value: 'all', label: 'Tudo' },
                            { value: 'income', label: 'Entradas' },
                            { value: 'expense', label: 'Saídas' }
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setViewFilter(filter.value as any)}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                                    viewFilter === filter.value
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Sections by type */}
                    {['income', 'expense'].map((type) => {
                        const typeCategories = displayedCategories.filter(c => c.type === type);
                        if (typeCategories.length === 0 && viewFilter !== type && viewFilter !== 'all') return null;
                        if (typeCategories.length === 0 && viewFilter === type) {
                            return (
                                <div key={type} className="col-span-full py-10 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="p-6 bg-slate-50 rounded-full border border-slate-100">
                                        <Tag className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">Nenhuma categoria de {type === 'income' ? 'entrada' : 'saída'} encontrada.</p>
                                </div>
                            );
                        }
                        if (typeCategories.length === 0 && viewFilter === 'all') return null; // Don't show empty section if 'all' is selected and no categories of this type exist

                        return (
                            <div key={type} className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className={cn(
                                        "w-1 h-4 rounded-full",
                                        type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                                    )} />
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                        {type === 'income' ? 'Entradas de Capital' : 'Saídas de Capital'}
                                    </h4>
                                    <div className="flex-1 border-t border-border" />
                                    <span className="text-[10px] font-bold text-muted-foreground/50">{typeCategories.length} cat</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {typeCategories.map((cat) => (
                                            <motion.div
                                                layout
                                                key={cat.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="group flex items-center justify-between p-5 rounded-[24px] border border-border bg-secondary/20 hover:bg-secondary hover:border-primary/30 hover:shadow-md transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "p-3 rounded-2xl transition-transform duration-500 group-hover:rotate-12",
                                                        cat.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                                                    )}>
                                                        {cat.type === 'income' ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <h4 className="font-bold text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{cat.name}</h4>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{cat.type === 'income' ? 'Categoria de Entrada' : 'Categoria de Saída'}</p>
                                                    </div>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all group-hover:opacity-100 group-hover:translate-x-0 sm:opacity-0 sm:translate-x-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-[32px] border-border shadow-2xl bg-popover/95 backdrop-blur-xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-xl font-bold text-foreground">Excluir Categoria?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-muted-foreground font-medium">
                                                                Esta ação não pode ser desfeita. Se houver transações vinculadas a esta categoria, a exclusão poderá falhar.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="gap-3 mt-6">
                                                            <AlertDialogCancel className="rounded-2xl border-border font-bold text-muted-foreground hover:bg-secondary h-12">Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteCategory(cat.id)}
                                                                className="rounded-2xl bg-destructive hover:bg-destructive/90 font-bold text-destructive-foreground h-12 px-6"
                                                            >
                                                                Confirmar Exclusão
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}

                    {displayedCategories.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-6 bg-slate-50 rounded-full border border-slate-100">
                                <Tag className="h-10 w-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">Nenhuma categoria encontrada para sua busca.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
