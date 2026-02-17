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
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
                <p className="text-muted-foreground">Crie e organize suas categorias de receitas e despesas.</p>
            </div>

            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Nova Categoria</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3 space-y-2">
                        <Label htmlFor="name">Nome da Categoria</Label>
                        <Input
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ex: Alimentação, Lazer"
                        />
                    </div>
                    <div className="w-full md:w-1/4 space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                            value={newType}
                            onValueChange={(value) => setNewType(value as "income" | "expense")}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Despesa</SelectItem>
                                <SelectItem value="income">Receita</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full md:w-auto gap-2 rounded-xl">
                        <Plus className="h-4 w-4" />
                        Adicionar
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-lg">Minhas Categorias</h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Nenhuma categoria encontrada.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {categories.map((category) => (
                            <div key={category.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${category.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="font-medium text-foreground">{category.name}</span>
                                    <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full uppercase">
                                        {category.type === 'income' ? 'Receita' : 'Despesa'}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
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
