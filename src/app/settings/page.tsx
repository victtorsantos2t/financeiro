"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { WalletTypeManager } from "@/components/dashboard/wallet-type-manager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Moon, Sun, ChevronRight, Globe, Camera, Bell, ShieldCheck, Mail, User, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TabValue = "profile" | "categories" | "wallet-types" | "preferences";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabValue>("profile");
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [email, setEmail] = useState("");
    const [currency, setCurrency] = useState("BRL");
    const [occupation, setOccupation] = useState("");

    const { theme, setTheme } = useTheme();
    const supabase = createClient();

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setEmail(user.email || "");
                let { data, error } = await supabase
                    .from('profiles')
                    .select(`name, avatar_url, currency, theme_preference, occupation`)
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setFullName(data.name || "");
                    setAvatarUrl(data.avatar_url);
                    if (data.currency) setCurrency(data.currency);
                    if (data.theme_preference) setTheme(data.theme_preference);
                    setOccupation(data.occupation || "");
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user');

            const updates = {
                id: user.id,
                name: fullName,
                avatar_url: avatarUrl,
                currency: currency,
                theme_preference: theme,
                occupation: occupation,
            };

            let { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            toast.success("Perfil atualizado", {
                description: "Suas informações foram salvas com sucesso.",
            });
        } catch (error: any) {
            console.error("Erro ao atualizar perfil:", error);
            toast.error("Erro", {
                description: error.message || "Não foi possível atualizar o perfil.",
            });
        } finally {
            setLoading(false);
        }
    }

    async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

        } catch (error) {
            toast.error("Erro no upload", {
                description: "Não foi possível enviar a imagem.",
            });
        } finally {
            setUploading(false);
        }
    }

    const tabs: { value: TabValue; label: string }[] = [
        { value: "profile", label: "Perfil" },
        { value: "categories", label: "Categorias" },
        { value: "wallet-types", label: "Contas" },
        { value: "preferences", label: "Ajustes" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 -m-6 p-6">
            {/* 1. HEADER & PROFILE HERO */}
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-32 lg:pb-12">
                <header className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Configurações</h1>
                        <p className="text-slate-500 font-medium text-base mt-2">Gerencie sua conta e preferências pessoais.</p>
                    </div>

                    {/* Integrated Profile Hero */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-md transition-shadow">
                        <div className="relative">
                            <Avatar className="h-20 w-20 ring-4 ring-slate-50 transition-all group-hover:ring-blue-50">
                                <AvatarImage src={avatarUrl || ""} />
                                <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                                    {fullName?.charAt(0) || email?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <label
                                htmlFor="avatar-upload-hero"
                                className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-2.5 rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all outline-none ring-4 ring-white"
                            >
                                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                                <input
                                    id="avatar-upload-hero"
                                    type="file"
                                    className="hidden"
                                    onChange={uploadAvatar}
                                    accept="image/*"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{fullName || "Usuário"}</h2>
                            <p className="text-slate-500 text-sm font-medium mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {occupation || "Sua biografia profissional"}
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    <ShieldCheck className="h-3 w-3" />
                                    Perfil Integrado
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 2. APPLE-STYLE SEGMENTED CONTROL */}
                <div className="sticky top-4 z-30 p-1.5 bg-slate-200/50 backdrop-blur-xl rounded-[24px] flex items-center gap-1 border border-white/40 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={cn(
                                    "relative flex-1 py-3 px-4 rounded-[18px] text-[13px] font-bold tracking-tight transition-all duration-300 min-w-[100px]",
                                    isActive ? "text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white rounded-[18px] shadow-sm z-0"
                                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 3. TAB CONTENT */}
                <div className="pt-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                            {activeTab === "profile" && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                        <div className="grid gap-8">
                                            <div className="space-y-4">
                                                <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-slate-300" /> Conta de Acesso
                                                </Label>
                                                <div className="relative group">
                                                    <Input
                                                        id="email"
                                                        value={email}
                                                        disabled
                                                        className="h-16 rounded-[22px] bg-slate-50/50 border-slate-50/50 text-slate-400 font-semibold px-8 cursor-not-allowed text-base shadow-inner transition-all"
                                                    />
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ShieldCheck className="h-5 w-5 text-slate-200" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label htmlFor="name" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-300" /> Nome de Exibição
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Seu nome"
                                                    className="h-16 rounded-[22px] bg-white border-slate-100 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all font-semibold text-slate-900 px-8 text-base shadow-sm group hover:border-slate-300"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <Label htmlFor="occupation" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                                    <Pencil className="h-4 w-4 text-slate-300" /> Bio Profissional
                                                </Label>
                                                <Input
                                                    id="occupation"
                                                    value={occupation}
                                                    onChange={(e) => setOccupation(e.target.value)}
                                                    placeholder="Ex: Designer, Desenvolvedor..."
                                                    className="h-16 rounded-[22px] bg-white border-slate-100 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all font-semibold text-slate-900 px-8 text-base shadow-sm group hover:border-slate-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop Actions */}
                                    <div className="hidden lg:flex justify-end pt-4">
                                        <Button
                                            onClick={updateProfile}
                                            disabled={loading}
                                            className="h-16 px-12 rounded-[22px] bg-slate-900 text-white font-bold shadow-2xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all text-base tracking-tight"
                                        >
                                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Alterações"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "categories" && <CategoryManager />}
                            {activeTab === "wallet-types" && <WalletTypeManager />}

                            {activeTab === "preferences" && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-slate-900 text-white rounded-[18px]">
                                                <Sun className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="text-xl font-bold text-slate-900">Tema e Aparência</h3>
                                                <p className="text-slate-400 text-sm font-medium">Configure a identidade visual.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <button
                                                onClick={() => setTheme("light")}
                                                className={cn(
                                                    "p-8 rounded-[28px] border-2 transition-all flex flex-col items-center gap-4 group",
                                                    theme === "light" ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-100 bg-white hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-4 rounded-2xl transition-all",
                                                    theme === "light" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                                                )}>
                                                    <Sun className="h-8 w-8" />
                                                </div>
                                                <span className={cn("text-sm font-bold tracking-tight", theme === "light" ? "text-slate-900" : "text-slate-400")}>Modo Claro</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme("dark")}
                                                className={cn(
                                                    "p-8 rounded-[28px] border-2 transition-all flex flex-col items-center gap-4 group",
                                                    theme === "dark" ? "border-slate-900 bg-slate-900 shadow-xl" : "border-slate-100 bg-white hover:bg-slate-50 text-slate-900"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-4 rounded-2xl transition-all",
                                                    theme === "dark" ? "bg-white text-slate-900" : "bg-slate-50 text-slate-400"
                                                )}>
                                                    <Moon className="h-8 w-8" />
                                                </div>
                                                <span className={cn("text-sm font-bold tracking-tight", theme === "dark" ? "text-white" : "text-slate-400")}>Modo Escuro</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-[18px]">
                                                <Globe className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Região e Moeda</h3>
                                                <p className="text-slate-400 text-sm font-medium">Defina os padrões de exibição monetária.</p>
                                            </div>
                                        </div>

                                        <Select value={currency} onValueChange={setCurrency}>
                                            <SelectTrigger className="h-16 rounded-[22px] bg-slate-50/50 border-transparent transition-all font-bold text-slate-900 px-8 text-base focus:bg-white focus:ring-4 focus:ring-blue-50/50">
                                                <SelectValue placeholder="Selecione a moeda" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2 bg-white/98 backdrop-blur-xl">
                                                <SelectItem value="BRL" className="rounded-xl py-4 focus:bg-slate-50 font-semibold">Real Brasileiro (R$)</SelectItem>
                                                <SelectItem value="USD" className="rounded-xl py-4 focus:bg-slate-50 font-semibold">Dólar Americano ($)</SelectItem>
                                                <SelectItem value="EUR" className="rounded-xl py-4 focus:bg-slate-50 font-semibold">Euro (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Desktop Actions */}
                                    <div className="hidden lg:flex justify-end pt-4">
                                        <Button
                                            onClick={updateProfile}
                                            disabled={loading}
                                            className="h-16 px-12 rounded-[22px] bg-slate-900 text-white font-bold shadow-2xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all text-base tracking-tight"
                                        >
                                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Aplicar Preferências"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* 4. MOBILE STICKY SAVE BUTTON */}
            <div className="lg:hidden fixed bottom-[90px] left-0 right-0 p-6 z-40">
                <AnimatePresence>
                    {(activeTab === "profile" || activeTab === "preferences") && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                        >
                            <Button
                                onClick={updateProfile}
                                disabled={loading}
                                className="w-full h-18 rounded-[26px] bg-slate-900 text-white font-bold shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] active:scale-95 transition-all text-base py-6"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Alterações"}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
