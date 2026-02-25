"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategoryManager } from "@/features/categories/category-manager";
import { WalletTypeManager } from "@/features/wallets/wallet-type-manager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, ShieldCheck, Sun, Moon, Globe, Mail, User, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TabValue = "profile" | "categories" | "wallet-types" | "preferences";

function BrutalistCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "bg-card overflow-hidden transition-all duration-300",
                "rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(15,23,42,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]",
                className
            )}
        >
            {children}
        </div>
    );
}

function SectionHeader({ label }: { label: string }) {
    return (
        <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 px-1 border-l-4 border-accent pl-3 py-1">
            {label}
        </h2>
    );
}

function BrutalistRow({
    icon, label, value, disabled, onChange, placeholder,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    disabled?: boolean;
    onChange?: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="flex items-center gap-4 px-4 py-4 min-h-[56px] border-b-2 border-foreground last:border-b-0 bg-background group transition-colors focus-within:bg-muted/30 hover:bg-muted/10">
            <div className="shrink-0 flex items-center justify-center w-[28px] text-foreground group-hover:text-accent transition-colors">
                {icon}
            </div>

            <div className="flex-[0_0_80px] sm:flex-[0_0_120px] min-w-0">
                <span className="block text-xs sm:text-sm font-black uppercase tracking-wider truncate text-foreground group-hover:text-accent transition-colors">
                    {label}
                </span>
            </div>

            {onChange ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-right outline-none placeholder:text-muted-foreground/30 focus:caret-accent text-sm sm:text-base font-bold appearance-none"
                    disabled={disabled}
                />
            ) : (
                <span className="flex-1 text-sm sm:text-base font-bold text-muted-foreground text-right overflow-hidden text-ellipsis whitespace-nowrap">
                    {value || placeholder || '—'}
                </span>
            )}
        </div>
    );
}

function BrutalistTabs({
    tabs, active, onChange
}: {
    tabs: { value: TabValue; label: string }[];
    active: TabValue;
    onChange: (v: TabValue) => void;
}) {
    return (
        <div className="flex flex-wrap lg:flex-nowrap items-center p-1 bg-background border-2 border-foreground shadow-[4px_4px_0_0_rgba(15,23,42,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] gap-1 mb-8 rounded-none w-full">
            {tabs.map((tab) => {
                const isActive = active === tab.value;
                return (
                    <button
                        key={tab.value}
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            "flex-1 min-w-[70px] py-3 sm:py-4 px-2 transition-all duration-200 uppercase tracking-widest text-[10px] sm:text-[11px] font-black focus:outline-none rounded-none",
                            isActive
                                ? "bg-foreground text-background scale-[0.98] border-2 border-transparent"
                                : "bg-transparent text-foreground hover:bg-muted border-2 border-transparent hover:border-foreground/20"
                        )}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

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

    useEffect(() => { getProfile(); }, []);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email || "");
                const { data } = await supabase
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
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    }

    async function updateProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');
            const { error } = await supabase.from('profiles').upsert({
                id: user.id, name: fullName, avatar_url: avatarUrl,
                currency, theme_preference: theme, occupation,
            });
            if (error) throw error;
            toast.success("Perfil atualizado", { description: "Suas informações foram salvas." });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Não foi possível salvar.";
            toast.error("Erro", { description: message });
        } finally { setLoading(false); }
    }

    async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setUploading(true);
            if (!event.target.files?.length) return;
            const file = event.target.files[0];
            const filePath = `${Math.random()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(publicUrl);
        } catch {
            toast.error("Erro no upload");
        } finally { setUploading(false); }
    }

    const tabs: { value: TabValue; label: string }[] = [
        { value: "profile", label: "Perfil" },
        { value: "categories", label: "Categorias" },
        { value: "wallet-types", label: "Contas" },
        { value: "preferences", label: "Preferências" },
    ];

    return (
        <div className="min-h-screen pb-40 bg-background px-4 sm:px-6 pt-6 sm:pt-10 max-w-4xl mx-auto selection:bg-accent selection:text-foreground">

            {/* ── Title ────────────────────────────────────────────── */}
            <div className="mb-6 sm:mb-10 flex flex-col items-start relative z-10 px-1">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-[0.05em] text-foreground leading-[0.8]">
                    SISTEMA.<br />
                    <span className="text-muted-foreground/50">CONF.</span>
                </h1>
                <div className="h-3 w-32 bg-accent mt-4 border-2 border-foreground shadow-[2px_2px_0_0_#09090b] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.2)]" />
            </div>

            {/* ── Profile Hero Card ─────────────────────────────────────── */}
            <BrutalistCard className="mb-8 p-0 border-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-10 relative bg-background">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>

                    <div className="relative shrink-0 mx-auto sm:mx-0 z-10 group">
                        <Avatar className="h-28 w-28 sm:h-36 sm:w-36 rounded-none border-4 border-foreground shadow-[6px_6px_0_0_rgba(15,23,42,1)] dark:shadow-[6px_6px_0_0_rgba(255,255,255,0.2)] transition-transform group-hover:-translate-y-1">
                            <AvatarImage src={avatarUrl || ""} className="object-cover" />
                            <AvatarFallback className="rounded-none bg-foreground text-background text-5xl font-black uppercase">
                                {fullName?.charAt(0) || email?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <label
                            htmlFor="avatar-upload-desktop"
                            className="absolute -bottom-4 -right-4 flex items-center justify-center w-12 h-12 cursor-pointer bg-accent border-4 border-foreground transition-all hover:scale-110 hover:-rotate-12 hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] active:scale-95"
                        >
                            {uploading
                                ? <Loader2 size={20} className="animate-spin text-foreground" />
                                : <Camera size={20} className="text-foreground" />
                            }
                            <input id="avatar-upload-desktop" type="file" className="hidden" onChange={uploadAvatar} accept="image/*" disabled={uploading} />
                        </label>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left z-10 mt-2 sm:mt-0 flex flex-col justify-center h-full sm:py-2">
                        <p className="text-2xl sm:text-4xl font-black text-foreground truncate uppercase tracking-tighter leading-none mb-2">
                            {fullName || "OPERADOR(A)"}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-muted-foreground truncate tracking-widest uppercase pb-4">
                            {occupation || "NÍVEL DE ACESSO: INDEFINIDO"}
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-auto pt-4 border-t-4 border-muted/50 w-full">
                            <ShieldCheck size={18} className="text-accent flex-shrink-0" />
                            <span className="text-xs sm:text-[10px] uppercase font-black tracking-[0.2em] text-foreground">
                                SISTEMA SINCRONIZADO
                            </span>
                        </div>
                    </div>
                </div>
            </BrutalistCard>

            {/* ── Segmented Control ─────────────────────────────────────── */}
            <BrutalistTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {/* ── Tab Content ───────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="space-y-8"
                >
                    {/* PERFIL ─────────────────────────────────────────── */}
                    {activeTab === "profile" && (
                        <>
                            <div className="space-y-3">
                                <SectionHeader label="Credenciais de Acesso" />
                                <BrutalistCard>
                                    <BrutalistRow
                                        icon={<Mail size={22} />}
                                        label="Endereço (ID)"
                                        value={email}
                                        disabled
                                    />
                                </BrutalistCard>
                            </div>

                            <div className="space-y-3">
                                <SectionHeader label="Identidade Física" />
                                <BrutalistCard>
                                    <BrutalistRow
                                        icon={<User size={22} />}
                                        label="Designação"
                                        value={fullName}
                                        onChange={setFullName}
                                        placeholder="Nome"
                                    />
                                    <BrutalistRow
                                        icon={<Pencil size={22} />}
                                        label="Atuação"
                                        value={occupation}
                                        onChange={setOccupation}
                                        placeholder="Função"
                                    />
                                </BrutalistCard>
                            </div>
                        </>
                    )}

                    {/* CATEGORIAS ──────────────────────────────────────── */}
                    {activeTab === "categories" && (
                        <div className="space-y-3">
                            <SectionHeader label="Estrutura de Categorias" />
                            <BrutalistCard>
                                <div className="p-4 sm:p-6 bg-background min-h-[400px]">
                                    <CategoryManager />
                                </div>
                            </BrutalistCard>
                        </div>
                    )}

                    {/* CONTAS ──────────────────────────────────────────── */}
                    {activeTab === "wallet-types" && (
                        <div className="space-y-3">
                            <SectionHeader label="Fontes Financeiras" />
                            <BrutalistCard>
                                <div className="p-4 sm:p-6 bg-background min-h-[400px]">
                                    <WalletTypeManager />
                                </div>
                            </BrutalistCard>
                        </div>
                    )}

                    {/* AJUSTES ──────────────────────────────────────────── */}
                    {activeTab === "preferences" && (
                        <>
                            <div className="space-y-3">
                                <SectionHeader label="Motor de Iluminação (Tema)" />
                                <BrutalistCard>
                                    {/* Tema Claro */}
                                    <button
                                        onClick={() => setTheme("light")}
                                        className="w-full flex items-center gap-4 px-4 sm:px-6 py-6 active:scale-[0.98] transition-all bg-background border-b-2 border-foreground hover:bg-muted/30 focus-visible:bg-muted/30 outline-none group"
                                    >
                                        <div className="shrink-0 w-[32px] flex items-center justify-center text-foreground group-hover:text-accent font-black transition-colors">
                                            <Sun size={24} />
                                        </div>
                                        <span className="flex-1 text-left text-sm sm:text-base font-black uppercase tracking-widest text-foreground group-hover:text-accent transition-colors">Fotônico (Claro)</span>
                                        {theme === "light" && (
                                            <Check size={24} className="text-accent stroke-[4]" />
                                        )}
                                    </button>
                                    {/* Tema Escuro */}
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className="w-full flex items-center gap-4 px-4 sm:px-6 py-6 active:scale-[0.98] transition-all bg-background hover:bg-muted/30 focus-visible:bg-muted/30 outline-none group"
                                    >
                                        <div className="shrink-0 w-[32px] flex items-center justify-center text-foreground group-hover:text-accent font-black transition-colors">
                                            <Moon size={24} />
                                        </div>
                                        <span className="flex-1 text-left text-sm sm:text-base font-black uppercase tracking-widest text-foreground group-hover:text-accent transition-colors">Gênesis (Escuro)</span>
                                        {theme === "dark" && (
                                            <Check size={24} className="text-accent stroke-[4]" />
                                        )}
                                    </button>
                                </BrutalistCard>
                            </div>

                            <div className="space-y-3">
                                <SectionHeader label="Padrão Financeiro Mundial" />
                                <BrutalistCard>
                                    {[
                                        { value: "BRL", label: "Real (R$)", flag: "BR" },
                                        { value: "USD", label: "Dólar ($)", flag: "US" },
                                        { value: "EUR", label: "Euro (€)", flag: "EU" },
                                    ].map((opt, i, arr) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setCurrency(opt.value)}
                                            className={cn(
                                                "w-full flex items-center gap-4 px-4 sm:px-6 py-5 active:scale-[0.98] transition-all bg-background hover:bg-muted/30 focus-visible:bg-muted/30 outline-none group",
                                                i < arr.length - 1 ? "border-b-2 border-foreground" : ""
                                            )}
                                        >
                                            <div className="shrink-0 w-[32px] flex items-center justify-center text-foreground font-black text-xs sm:text-sm tracking-tighter bg-foreground/10 py-1.5 border border-foreground/30">
                                                {opt.flag}
                                            </div>
                                            <span className="flex-1 text-left text-sm sm:text-base font-black uppercase tracking-widest text-foreground group-hover:text-accent transition-colors">
                                                {opt.label}
                                            </span>
                                            {currency === opt.value && (
                                                <Check size={24} className="text-accent stroke-[4]" />
                                            )}
                                        </button>
                                    ))}
                                </BrutalistCard>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Brutalist Save Button ─────────────────── */}
            <AnimatePresence>
                {(activeTab === "profile" || activeTab === "preferences") && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                        className="pt-10 pb-12 w-full mt-auto"
                    >
                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            className={cn(
                                "w-full flex items-center justify-center transition-all",
                                "h-16 sm:h-20 rounded-none",
                                "bg-foreground text-background font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[13px] sm:text-base",
                                "border-4 border-transparent hover:border-accent hover:text-accent",
                                "shadow-[8px_8px_0_0_#00E676] hover:shadow-[3px_3px_0_0_#00E676] hover:translate-x-[5px] hover:translate-y-[5px]",
                                "active:shadow-none active:translate-x-[8px] active:translate-y-[8px]",
                                loading && "opacity-70 pointer-events-none"
                            )}
                        >
                            {loading
                                ? <Loader2 size={32} className="animate-spin" />
                                : activeTab === "preferences" ? "Aplicar Metadados" : "GRAVAR NOVO PERFIL"
                            }
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// aria-label
// aria-label
