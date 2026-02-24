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
            <div className="bg-card rounded-none p-8 border-2 border-border shadow-none space-y-8">
                <div className="flex items-center justify-between border-b-2 border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary text-primary-foreground border-2 border-primary">
                            <Tag className="h-5 w-5 stroke-[2.5]" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-foreground">Nova Categoria</h3>
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Organize seus lançamentos por tipo.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="space-y-4 w-full flex-1">
                        <Label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1">
                            Identificação da Categoria
                        </Label>
                        <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Ex: Viagens, Assinaturas..."
                            className="h-[42px] rounded-none bg-background border-2 border-border focus:border-primary focus:ring-0 transition-all font-black text-[12px] uppercase tracking-widest text-foreground px-4 shadow-none hover:border-primary/50"
                        />
                    </div>

                    <div className="space-y-4 w-full lg:w-[220px]">
                        <Label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1">
                            Fluxo Financeiro
                        </Label>
                        <Select
                            value={newCategoryType}
                            onValueChange={(val: "income" | "expense") => setNewCategoryType(val)}
                        >
                            <SelectTrigger className="h-[42px] rounded-none bg-background border-2 border-border transition-all font-black text-[12px] uppercase tracking-widest text-foreground px-4 focus:border-primary focus:ring-0 shadow-none hover:border-primary/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-2 border-border shadow-none p-0 bg-card">
                                <SelectItem value="expense" className="rounded-none py-3 focus:bg-secondary font-black text-[10px] uppercase tracking-widest text-foreground flex items-center gap-2 cursor-pointer">
                                    Despesa
                                </SelectItem>
                                <SelectItem value="income" className="rounded-none py-3 focus:bg-secondary font-black text-[10px] uppercase tracking-widest text-foreground flex items-center gap-2 cursor-pointer">
                                    Receita
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleAddCategory}
                        disabled={loading || !newCategoryName.trim()}
                        className="h-[42px] px-8 rounded-none bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-none hover:bg-primary/90 active:scale-95 transition-all w-full lg:w-auto border border-primary"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2 stroke-[3]" />}
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* 2. EXISTING CATEGORIES LIST */}
            <div className="bg-card rounded-none p-8 border-2 border-border shadow-none space-y-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-border pb-4">
                        <div className="space-y-1">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-foreground">Categorias Ativas</h3>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black">Lista organizada dos seus tipos de lançamento.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group flex-1 sm:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-foreground transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 rounded-none bg-background border-2 border-border focus:border-primary focus:ring-0 transition-all pl-10 pr-4 text-[10px] font-black uppercase tracking-widest text-foreground outline-none shadow-none"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleLoadDefaults}
                                disabled={loading}
                                className="h-10 w-10 text-[10px] font-black uppercase tracking-widest rounded-none bg-background border-2 border-border hover:bg-secondary hover:border-primary/50 transition-all shrink-0 p-0 shadow-none"
                                title="Carregar Padrões"
                            >
                                <Sparkles className="h-4 w-4 stroke-[2.5]" />
                            </Button>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-0 w-fit border-2 border-border bg-background p-0 rounded-none shadow-none">
                        {[
                            { value: 'all', label: 'Tudo' },
                            { value: 'income', label: 'Entradas' },
                            { value: 'expense', label: 'Saídas' }
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setViewFilter(filter.value as any)}
                                className={cn(
                                    "px-4 py-2 rounded-none text-[10px] uppercase tracking-widest font-black transition-all border-r-2 border-border last:border-r-0",
                                    viewFilter === filter.value
                                        ? "bg-foreground text-background shadow-none"
                                        : "text-foreground hover:bg-secondary cursor-pointer"
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
                                    <div className="p-4 bg-background border-2 border-border rounded-none">
                                        <Tag className="h-8 w-8 text-muted-foreground stroke-[2.5]" />
                                    </div>
                                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Nenhuma categoria de {type === 'income' ? 'entrada' : 'saída'} encontrada.</p>
                                </div>
                            );
                        }
                        if (typeCategories.length === 0 && viewFilter === 'all') return null; // Don't show empty section if 'all' is selected and no categories of this type exist

                        return (
                            <div key={type} className="space-y-4">
                                <div className="flex items-center gap-3 px-1 border-b-2 border-border pb-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-none",
                                        type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                                    )} />
                                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">
                                        {type === 'income' ? 'Entradas de Capital' : 'Saídas de Capital'}
                                    </h4>
                                    <div className="flex-1" />
                                    <span className="text-[8px] font-black text-foreground uppercase tracking-widest px-2 py-0.5 border border-border bg-secondary">{typeCategories.length} cat</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {typeCategories.map((cat) => (
                                            <motion.div
                                                layout
                                                key={cat.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="group flex items-center justify-between p-4 rounded-none border-2 border-border bg-background hover:bg-secondary hover:border-primary/50 hover:shadow-none transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "p-2 rounded-none border-2 border-current transition-transform duration-500",
                                                        cat.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                                    )}>
                                                        {cat.type === 'income' ? <ArrowDownCircle className="h-5 w-5 stroke-[2.5]" /> : <ArrowUpCircle className="h-5 w-5 stroke-[2.5]" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-black text-[12px] uppercase tracking-widest text-foreground leading-none group-hover:text-primary transition-colors">{cat.name}</h4>
                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{cat.type === 'income' ? 'Categoria de Entrada' : 'Categoria de Saída'}</p>
                                                    </div>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none border-border transition-all group-hover:opacity-100 group-hover:translate-x-0 sm:opacity-0 sm:translate-x-2"
                                                        >
                                                            <Trash2 className="h-4 w-4 stroke-[3]" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-none border-2 border-border shadow-none bg-card p-0 overflow-hidden">
                                                        <AlertDialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                                                            <AlertDialogTitle className="text-[12px] font-black uppercase tracking-widest text-foreground">Excluir Categoria?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
                                                                Esta ação não pode ser desfeita. Se houver transações vinculadas a esta categoria, a exclusão poderá falhar.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="gap-3 px-6 py-4 bg-secondary">
                                                            <AlertDialogCancel className="rounded-none border-2 border-border font-black text-foreground hover:bg-background h-[42px] uppercase tracking-widest text-[10px]">Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteCategory(cat.id)}
                                                                className="rounded-none bg-destructive hover:bg-destructive/90 font-black text-destructive-foreground h-[42px] px-6 uppercase tracking-widest text-[10px] border border-destructive shadow-none"
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
                            <div className="p-4 bg-background border-2 border-border rounded-none">
                                <Tag className="h-8 w-8 text-muted-foreground stroke-[2.5]" />
                            </div>
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Nenhuma categoria encontrada para sua busca.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// aria-label
