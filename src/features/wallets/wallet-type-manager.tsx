"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WalletService } from "@/services/wallet.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Loader2, Wallet, CreditCard, Landmark, Coins } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface WalletType {
    id: string;
    name: string;
}

export function WalletTypeManager() {
    const [types, setTypes] = useState<WalletType[]>([]);
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            setFetching(true);
            const data = await WalletService.listTypes();
            setTypes(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar tipos:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser(); // Mantendo auth aqui por simplicidade ou delegando ao service
            if (!user) throw new Error("Não autenticado");

            const { data, error } = await supabase
                .from("wallet_types")
                .insert([{ name: newName, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;

            setTypes([...types, data]);
            setNewName("");
            toast.success("Tipo de conta cadastrado!");
        } catch (error: any) {
            toast.error("Erro ao adicionar", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const typeToRemove = types.find(t => t.id === id);
        setTypes(prev => prev.filter(t => t.id !== id));

        try {
            const { error } = await supabase
                .from("wallet_types")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Tipo de conta removido.");
        } catch (error: any) {
            if (typeToRemove) {
                setTypes(prev => [...prev, typeToRemove].sort((a, b) => a.name.localeCompare(b.name)));
            }
            toast.error("Erro ao excluir", {
                description: "Verifique se este tipo não está sendo usado em alguma carteira."
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. ADD NEW TYPE SECTION */}
            <div className="bg-card rounded-none p-8 border-2 border-border shadow-none space-y-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-foreground text-background border-2 border-transparent">
                        <Landmark className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Tipos de Conta</h3>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Cadastre novas categorias para suas instituições.</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="space-y-4 flex-1 w-full">
                        <Label htmlFor="new-type" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                            Nome do Tipo de Conta
                        </Label>
                        <Input
                            id="new-type"
                            placeholder="Ex: Investimento, Vale Alimentação..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            className="h-[42px] rounded-none bg-background border-2 border-border focus:border-primary focus:ring-0 transition-all font-black text-[10px] uppercase tracking-widest text-foreground px-4 shadow-none hover:border-primary/50"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={loading || !newName.trim()}
                        className="h-[42px] px-8 rounded-none bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-none hover:bg-primary/90 active:scale-95 transition-all w-full lg:w-auto border border-primary"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2 stroke-[3]" />}
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* 2. EXISTING TYPES LIST */}
            <div className="bg-card rounded-none p-8 border-2 border-border shadow-none space-y-8">
                <div className="space-y-1 border-b border-border pb-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Suas Classificações</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipos de conta disponíveis para uso.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {fetching ? (
                            <div className="col-span-full py-12 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-slate-200 dark:text-slate-800 animate-spin" />
                            </div>
                        ) : types.length === 0 ? (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium italic">Nenhum tipo personalizado cadastrado.</p>
                            </div>
                        ) : (
                            types.map((type, index) => (
                                <motion.div
                                    layout
                                    key={type.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center justify-between p-4 rounded-none border-2 border-border bg-background hover:bg-secondary hover:border-primary/50 hover:shadow-none transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-secondary border border-border transition-transform group-hover:scale-110">
                                            {index % 2 === 0 ? <CreditCard className="h-5 w-5 text-muted-foreground stroke-[2.5]" /> : <Coins className="h-5 w-5 text-muted-foreground stroke-[2.5]" />}
                                        </div>
                                        <span className="font-black text-foreground text-[10px] uppercase tracking-widest">{type.name}</span>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-[30px] w-[30px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none border-border transition-all group-hover:opacity-100 group-hover:translate-x-0 sm:opacity-0 sm:translate-x-2"
                                            >
                                                <Trash2 className="h-4 w-4 stroke-[3]" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-none border-2 border-border shadow-none bg-card">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-[12px] font-black uppercase tracking-widest text-foreground">Excluir Tipo de Conta?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
                                                    Esta ação removerá este tipo de conta permanentemente. Verifique se ele não está sendo usado em nenhuma carteira ativa.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-3 mt-6">
                                                <AlertDialogCancel className="rounded-none border-2 border-border font-black text-foreground hover:bg-secondary h-[42px] uppercase tracking-widest text-[10px]">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(type.id)}
                                                    className="rounded-none bg-destructive hover:bg-destructive/90 font-black text-destructive-foreground h-[42px] px-6 uppercase tracking-widest text-[10px] border border-destructive shadow-none"
                                                >
                                                    Confirmar Exclusão
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// aria-label
