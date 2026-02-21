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
        <div className="flex flex-col min-h-screen bg-background pb-12">
            {/* 1. HEADER & PROFILE HERO */}
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-32 lg:pb-12">
                <header className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">Configurações</h1>
                        <p className="text-muted-foreground font-medium text-base mt-1">Gerencie sua conta e preferências pessoais.</p>
                    </div>

                    {/* Integrated Profile Hero */}
                    <div className="bg-card rounded-card p-6 shadow-sm border border-border flex items-center gap-6 group hover:shadow-md transition-all">
                        <div className="relative">
                            <Avatar className="h-20 w-20 ring-4 ring-background transition-all group-hover:ring-primary/10">
                                <AvatarImage src={avatarUrl || ""} />
                                <AvatarFallback className="bg-primary text-white text-xl font-bold">
                                    {fullName?.charAt(0) || email?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <label
                                htmlFor="avatar-upload-hero"
                                className="absolute -bottom-1 -right-1 bg-foreground text-card p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all outline-none ring-2 ring-card"
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
                            <h2 className="text-xl font-bold text-foreground tracking-tight leading-none">{fullName || "Usuário"}</h2>
                            <p className="text-muted-foreground text-sm font-medium mt-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {occupation || "Sua biografia profissional"}
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    <ShieldCheck className="h-3 w-3" />
                                    Perfil Integrado
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 2. APPLE-STYLE SEGMENTED CONTROL */}
                <div className="sticky top-4 z-30 p-1 bg-secondary/50 backdrop-blur-xl rounded-xl flex items-center gap-1 border border-border shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={cn(
                                    "relative flex-1 py-2.5 px-4 rounded-lg text-[13px] font-bold tracking-tight transition-all duration-300 min-w-[100px]",
                                    isActive ? "text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-card rounded-lg shadow-sm z-0"
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
                                    <div className="bg-card rounded-card p-8 border border-border shadow-sm space-y-8">
                                        <div className="grid gap-8">
                                            <div className="space-y-3">
                                                <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Mail className="h-4 w-4" /> Conta de Acesso
                                                </Label>
                                                <div className="relative group">
                                                    <Input
                                                        id="email"
                                                        value={email}
                                                        disabled
                                                        className="h-14 rounded-xl bg-secondary/20 border-border text-muted-foreground font-bold px-6 cursor-not-allowed text-base shadow-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <User className="h-4 w-4" /> Nome de Exibição
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Seu nome"
                                                    className="h-14 rounded-xl bg-card border-border focus:bg-card focus:border-primary focus:ring-0 transition-all font-bold text-foreground px-6 text-base shadow-sm group hover:border-border/80"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="occupation" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Pencil className="h-4 w-4" /> Bio Profissional
                                                </Label>
                                                <Input
                                                    id="occupation"
                                                    value={occupation}
                                                    onChange={(e) => setOccupation(e.target.value)}
                                                    placeholder="Ex: Designer, Desenvolvedor..."
                                                    className="h-14 rounded-xl bg-card border-border focus:bg-card focus:border-primary focus:ring-0 transition-all font-bold text-foreground px-6 text-base shadow-sm group hover:border-border/80"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop Actions */}
                                    <div className="hidden lg:flex justify-end pt-4">
                                        <Button
                                            onClick={updateProfile}
                                            disabled={loading}
                                            className="h-14 px-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/10 transition-all active:scale-95 text-base"
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
                                    <div className="bg-card rounded-card p-8 border border-border shadow-sm space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-secondary rounded-xl text-primary">
                                                <Sun className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="text-xl font-bold text-foreground tracking-tight">Tema e Aparência</h3>
                                                <p className="text-muted-foreground text-sm font-medium">Configure a identidade visual.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <button
                                                onClick={() => setTheme("light")}
                                                className={cn(
                                                    "p-8 rounded-card border-2 transition-all flex flex-col items-center gap-4 group",
                                                    theme === "light" ? "border-primary bg-secondary/50 shadow-sm" : "border-border bg-card hover:bg-secondary/20"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-4 rounded-xl transition-all",
                                                    theme === "light" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                                                )}>
                                                    <Sun className="h-8 w-8" />
                                                </div>
                                                <span className={cn("text-sm font-bold tracking-tight", theme === "light" ? "text-foreground" : "text-muted-foreground")}>Modo Claro</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme("dark")}
                                                className={cn(
                                                    "p-8 rounded-card border-2 transition-all flex flex-col items-center gap-4 group",
                                                    theme === "dark" ? "border-primary bg-[#0f172a] shadow-xl" : "border-border bg-card hover:bg-secondary/20"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-4 rounded-xl transition-all",
                                                    theme === "dark" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                                                )}>
                                                    <Moon className="h-8 w-8" />
                                                </div>
                                                <span className={cn("text-sm font-bold tracking-tight", theme === "dark" ? "text-white" : "text-muted-foreground")}>Modo Escuro</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-card rounded-card p-8 border border-border shadow-sm space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-secondary rounded-xl text-primary">
                                                <Globe className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="text-xl font-bold text-foreground tracking-tight">Região e Moeda</h3>
                                                <p className="text-muted-foreground text-sm font-medium">Defina os padrões de exibição monetária.</p>
                                            </div>
                                        </div>

                                        <Select value={currency} onValueChange={setCurrency}>
                                            <SelectTrigger className="h-14 rounded-xl bg-secondary/30 border-border transition-all font-bold text-foreground px-8 text-base focus:bg-card focus:ring-2 focus:ring-primary/10">
                                                <SelectValue placeholder="Selecione a moeda" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border shadow-2xl p-2 bg-card">
                                                <SelectItem value="BRL" className="rounded-lg py-3 font-semibold">Real Brasileiro (R$)</SelectItem>
                                                <SelectItem value="USD" className="rounded-lg py-3 font-semibold">Dólar Americano ($)</SelectItem>
                                                <SelectItem value="EUR" className="rounded-lg py-3 font-semibold">Euro (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Desktop Actions */}
                                    <div className="hidden lg:flex justify-end pt-4">
                                        <Button
                                            onClick={updateProfile}
                                            disabled={loading}
                                            className="h-14 px-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/10 transition-all active:scale-95 text-base"
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
                                className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all text-base py-4"
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
