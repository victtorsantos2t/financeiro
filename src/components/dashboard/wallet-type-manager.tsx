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
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white rounded-[18px]">
                        <Landmark className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tipos de Conta</h3>
                        <p className="text-slate-400 text-sm font-medium">Cadastre novas categorias para suas instituições.</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="space-y-4 flex-1 w-full">
                        <Label htmlFor="new-type" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">
                            Nome do Tipo de Conta
                        </Label>
                        <Input
                            id="new-type"
                            placeholder="Ex: Investimento, Vale Alimentação..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            className="h-16 rounded-[22px] bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-900 focus:ring-0 transition-all font-semibold text-slate-900 px-8 text-base shadow-inner group hover:border-slate-200"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={loading || !newName.trim()}
                        className="h-16 px-10 rounded-[22px] bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all text-base w-full lg:w-auto"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* 2. EXISTING TYPES LIST */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Suas Classificações</h3>
                    <p className="text-slate-400 text-sm font-medium">Tipos de conta disponíveis para uso.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {fetching ? (
                            <div className="col-span-full py-12 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-slate-200 animate-spin" />
                            </div>
                        ) : types.length === 0 ? (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-slate-400 text-sm font-medium italic">Nenhum tipo personalizado cadastrado.</p>
                            </div>
                        ) : (
                            types.map((type, index) => (
                                <motion.div
                                    layout
                                    key={type.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center justify-between p-5 rounded-[24px] border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform group-hover:scale-110">
                                            {index % 2 === 0 ? <CreditCard className="h-5 w-5 text-slate-400" /> : <Coins className="h-5 w-5 text-slate-400" />}
                                        </div>
                                        <span className="font-bold text-slate-800 text-sm tracking-tight">{type.name}</span>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all group-hover:opacity-100 group-hover:translate-x-0 sm:opacity-0 sm:translate-x-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-[32px] border-slate-100 shadow-2xl bg-white/95 backdrop-blur-xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-bold text-slate-900">Excluir Tipo de Conta?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-500 font-medium">
                                                    Esta ação removerá este tipo de conta permanentemente. Verifique se ele não está sendo usado em nenhuma carteira ativa.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-3 mt-6">
                                                <AlertDialogCancel className="rounded-2xl border-slate-100 font-bold text-slate-500 hover:bg-slate-50 h-12">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(type.id)}
                                                    className="rounded-2xl bg-rose-500 hover:bg-rose-600 font-bold text-white h-12 px-6"
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
