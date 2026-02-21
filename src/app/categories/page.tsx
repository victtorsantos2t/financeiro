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
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { IOSPageHeader } from "@/components/layout/ios-page-header";

type Category = {
    id: string;
    name: string;
    type: "income" | "expense";
    icon: string | null;
    color: string | null;
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"income" | "expense">("expense");
    const supabase = createClient();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("name", { ascending: true });

            if (!error && data) {
                setCategories(data);
            }
        }
        setLoading(false);
    };

    const handleAddCategory = async () => {
        if (!newName) return;

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase.from("categories").insert([
                {
                    user_id: user.id,
                    name: newName,
                    type: newType,
                    icon: "default", // Placeholder for now
                    color: "gray", // Placeholder for now
                },
            ]);

            if (error) {
                alert("Erro ao criar categoria");
            } else {
                setNewName("");
                fetchCategories();
            }
        }
    };

    const handleDeleteCategory = async (id: string) => {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (!error) {
            fetchCategories();
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <IOSPageHeader title="Categorias" subtitle="Receitas e despesas" />
            <div className="hidden md:flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Gerenciar Categorias</h1>
                <p className="text-sm text-muted-foreground font-medium">Crie e organize suas categorias de receitas e despesas.</p>
            </div>

            <div className="bg-card p-6 rounded-card border border-border shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-6 tracking-tight">Nova Categoria</h3>
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="w-full md:w-1/3 space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nome da Categoria</Label>
                        <Input
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ex: Alimentação, Lazer"
                            className="h-11 rounded-xl bg-secondary/30 border-border"
                        />
                    </div>
                    <div className="w-full md:w-1/4 space-y-2">
                        <Label htmlFor="type" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tipo</Label>
                        <Select
                            value={newType}
                            onValueChange={(value) => setNewType(value as "income" | "expense")}
                        >
                            <SelectTrigger className="h-11 rounded-xl bg-secondary/30 border-border font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                                <SelectItem value="expense" className="rounded-lg">Despesa</SelectItem>
                                <SelectItem value="income" className="rounded-lg">Receita</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full md:w-auto h-11 px-8 gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-all shadow-sm">
                        <Plus className="h-4 w-4" />
                        Adicionar
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-card border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-secondary/10">
                    <h3 className="font-bold text-lg text-foreground tracking-tight">Minhas Categorias</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground font-bold">Carregando...</div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground font-bold">Nenhuma categoria encontrada.</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {categories.map((category) => (
                            <div key={category.id} className="p-4 flex justify-between items-center hover:bg-secondary/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2.5 h-2.5 rounded-full ${category.type === 'income' ? 'bg-success' : 'bg-destructive'}`}></div>
                                    <span className="font-bold text-foreground text-sm tracking-tight">{category.name}</span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter",
                                        category.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                    )}>
                                        {category.type === 'income' ? 'Receita' : 'Despesa'}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => handleDeleteCategory(category.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
