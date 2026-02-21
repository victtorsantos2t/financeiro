"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { WalletTypeManager } from "@/components/dashboard/wallet-type-manager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, ShieldCheck, ChevronRight, Sun, Moon, Globe, Mail, User, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TabValue = "profile" | "categories" | "wallet-types" | "preferences";

// ─── iOS Segmented Control ───────────────────────────────────────────────────
function IOSSegmentedControl({
    tabs, active, onChange
}: {
    tabs: { value: TabValue; label: string }[];
    active: TabValue;
    onChange: (v: TabValue) => void;
}) {
    return (
        <div
            className="flex items-center p-[3px] rounded-[10px] overflow-x-auto scrollbar-hide"
            style={{
                background: 'rgba(118,118,128,0.12)',
                gap: '2px',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
            }}
        >
            {tabs.map((tab) => {
                const isActive = active === tab.value;
                return (
                    <button
                        key={tab.value}
                        onClick={() => onChange(tab.value)}
                        className="relative flex-1 min-w-[72px] py-[6px] px-3 rounded-[8px] transition-none"
                        style={{
                            background: isActive ? '#FFFFFF' : 'transparent',
                            boxShadow: isActive
                                ? '0 2px 6px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)'
                                : 'none',
                            color: isActive ? '#000000' : '#3C3C43',
                            fontSize: '13px',
                            fontWeight: isActive ? 600 : 400,
                            letterSpacing: '-0.1px',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.15s, box-shadow 0.15s',
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── iOS Row (lista agrupada) ─────────────────────────────────────────────────
function IOSRow({
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
        <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ minHeight: '52px' }}
        >
            {/* Ícone com cor primária do sistema */}
            <div className="shrink-0 flex items-center justify-center w-[26px]" style={{ color: '#3B82F6' }}>
                {icon}
            </div>

            <div className="flex-1 min-w-0">
                <span
                    className="block text-[15px] truncate"
                    style={{ fontWeight: 400, color: '#000' }}
                >
                    {label}
                </span>
            </div>

            {/* Valor / campo editável */}
            {onChange ? (
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#3C3C43',
                        fontSize: '15px',
                        fontWeight: 400,
                        textAlign: 'right',
                        width: '150px',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
                        caretColor: '#3B82F6',
                    }}
                />
            ) : (
                <span style={{ color: '#8E8E93', fontSize: '15px', fontWeight: 400, maxWidth: 160, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {value || placeholder || '—'}
                </span>
            )}

            {disabled && (
                <ChevronRight size={14} className="shrink-0 ml-1" style={{ color: '#C7C7CC' }} />
            )}
        </div>
    );
}


// ─── iOS Grouped Card ────────────────────────────────────────────────────────
function IOSCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn("bg-white overflow-hidden", className)}
            style={{
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)',
            }}
        >
            {children}
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
    return (
        <h2
            style={{
                fontSize: '13px',
                fontWeight: 400,
                color: '#8E8E93',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                paddingLeft: 16,
                paddingBottom: 6,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
            }}
        >
            {label}
        </h2>
    );
}

// ─── Separator iOS ────────────────────────────────────────────────────────────
function IOSSeparator() {
    return (
        <div style={{ marginLeft: 56, height: '0.5px', background: 'rgba(60,60,67,0.12)' }} />
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
        } catch (error: any) {
            toast.error("Erro", { description: error.message || "Não foi possível salvar." });
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
        { value: "preferences", label: "Ajustes" },
    ];

    const iOSFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";

    return (
        <div
            className="min-h-screen pb-32"
            style={{ background: '#F2F2F7', fontFamily: iOSFont }}
        >
            {/* ── Large Title (iOS Navigation Bar) ─────────────────────────── */}
            <div
                className="sticky top-0 z-40 px-4 pb-4"
                style={{
                    background: 'rgba(242,242,247,0.94)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    borderBottom: '0.5px solid rgba(0,0,0,0.12)',
                    paddingTop: 'max(env(safe-area-inset-top), 56px)',
                }}
            >
                <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px', color: '#000', lineHeight: 1.1 }}>
                    Configurações
                </h1>
            </div>

            <div className="px-4 pt-6 space-y-5 max-w-2xl mx-auto">

                {/* ── Profile Hero Card ─────────────────────────────────────── */}
                <IOSCard>
                    <div className="flex items-center gap-4 px-4 py-4">
                        <div className="relative shrink-0">
                            <Avatar className="h-[60px] w-[60px]">
                                <AvatarImage src={avatarUrl || ""} />
                                <AvatarFallback
                                    style={{ background: '#007AFF', color: 'white', fontSize: 24, fontWeight: 600 }}
                                >
                                    {fullName?.charAt(0) || email?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <label
                                htmlFor="avatar-upload-ios"
                                className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full cursor-pointer active:opacity-60"
                                style={{
                                    width: 22, height: 22,
                                    background: '#636366',
                                    border: '2px solid white',
                                }}
                            >
                                {uploading
                                    ? <Loader2 size={10} className="animate-spin text-white" />
                                    : <Camera size={10} className="text-white" />
                                }
                                <input id="avatar-upload-ios" type="file" className="hidden" onChange={uploadAvatar} accept="image/*" disabled={uploading} />
                            </label>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p style={{ fontSize: 17, fontWeight: 600, color: '#000', lineHeight: 1.2 }}>
                                {fullName || "Usuário"}
                            </p>
                            <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>
                                {occupation || "Sua bio profissional"}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                                <ShieldCheck size={11} style={{ color: '#34C759' }} />
                                <span style={{ fontSize: 11, color: '#34C759', fontWeight: 500, letterSpacing: '0.03em' }}>
                                    PERFIL INTEGRADO
                                </span>
                            </div>
                        </div>
                        <ChevronRight size={18} style={{ color: '#C7C7CC' }} />
                    </div>
                </IOSCard>

                {/* ── Segmented Control ─────────────────────────────────────── */}
                <IOSSegmentedControl tabs={tabs} active={activeTab} onChange={setActiveTab} />

                {/* ── Tab Content ───────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-5"
                    >
                        {/* PERFIL ─────────────────────────────────────────── */}
                        {activeTab === "profile" && (
                            <>
                                <div className="space-y-2">
                                    <SectionHeader label="Conta de Acesso" />
                                    <IOSCard>
                                        <IOSRow
                                            icon={<Mail size={16} />}
                                            label="E-mail"
                                            value={email}
                                            disabled
                                        />
                                    </IOSCard>
                                </div>

                                <div className="space-y-2">
                                    <SectionHeader label="Informações Pessoais" />
                                    <IOSCard>
                                        <IOSRow
                                            icon={<User size={16} />}
                                            label="Nome"
                                            value={fullName}
                                            onChange={setFullName}
                                            placeholder="Seu nome"
                                        />
                                        <IOSSeparator />
                                        <IOSRow
                                            icon={<Pencil size={16} />}
                                            label="Bio"
                                            value={occupation}
                                            onChange={setOccupation}
                                            placeholder="Cargo ou profissão"
                                        />
                                    </IOSCard>
                                </div>
                            </>
                        )}

                        {/* CATEGORIAS ──────────────────────────────────────── */}
                        {activeTab === "categories" && (
                            <div className="space-y-2">
                                <SectionHeader label="Gerenciar Categorias" />
                                <IOSCard>
                                    <div className="p-4">
                                        <CategoryManager />
                                    </div>
                                </IOSCard>
                            </div>
                        )}

                        {/* CONTAS ──────────────────────────────────────────── */}
                        {activeTab === "wallet-types" && (
                            <div className="space-y-2">
                                <SectionHeader label="Tipos de Conta" />
                                <IOSCard>
                                    <div className="p-4">
                                        <WalletTypeManager />
                                    </div>
                                </IOSCard>
                            </div>
                        )}

                        {/* AJUSTES ──────────────────────────────────────────── */}
                        {activeTab === "preferences" && (
                            <>
                                <div className="space-y-2">
                                    <SectionHeader label="Aparência" />
                                    <IOSCard>
                                        {/* Tema Claro */}
                                        <button
                                            onClick={() => setTheme("light")}
                                            className="w-full flex items-center gap-3 px-4 py-3 active:opacity-60 transition-opacity"
                                        >
                                            <div className="shrink-0 w-[26px] flex items-center justify-center" style={{ color: '#3B82F6' }}>
                                                <Sun size={16} />
                                            </div>
                                            <span style={{ flex: 1, textAlign: 'left', fontSize: 15, color: '#000' }}>Modo Claro</span>
                                            {theme === "light" && (
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M4 10.5L8 14.5L16 6.5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                        <IOSSeparator />
                                        {/* Tema Escuro */}
                                        <button
                                            onClick={() => setTheme("dark")}
                                            className="w-full flex items-center gap-3 px-4 py-3 active:opacity-60 transition-opacity"
                                        >
                                            <div className="shrink-0 w-[26px] flex items-center justify-center" style={{ color: '#3B82F6' }}>
                                                <Moon size={16} />
                                            </div>
                                            <span style={{ flex: 1, textAlign: 'left', fontSize: 15, color: '#000' }}>Modo Escuro</span>
                                            {theme === "dark" && (
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M4 10.5L8 14.5L16 6.5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </IOSCard>
                                </div>

                                <div className="space-y-2">
                                    <SectionHeader label="Região e Moeda" />
                                    <IOSCard>
                                        {[
                                            { value: "BRL", label: "Real Brasileiro (R$)", flag: "🇧🇷" },
                                            { value: "USD", label: "Dólar Americano ($)", flag: "🇺🇸" },
                                            { value: "EUR", label: "Euro (€)", flag: "🇪🇺" },
                                        ].map((opt, i, arr) => (
                                            <div key={opt.value}>
                                                <button
                                                    onClick={() => setCurrency(opt.value)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 active:opacity-60 transition-opacity"
                                                >
                                                    <div className="shrink-0 w-[26px] flex items-center justify-center" style={{ color: '#3B82F6' }}>
                                                        <Globe size={16} />
                                                    </div>
                                                    <span style={{ flex: 1, textAlign: 'left', fontSize: 15, color: '#000' }}>
                                                        {opt.flag} {opt.label}
                                                    </span>
                                                    {currency === opt.value && (
                                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                            <path d="M4 10.5L8 14.5L16 6.5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    )}
                                                </button>
                                                {i < arr.length - 1 && <IOSSeparator />}
                                            </div>
                                        ))}
                                    </IOSCard>
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── iOS Save Button (fixed bottom, only profile/preferences) ──── */}
            <AnimatePresence>
                {(activeTab === "profile" || activeTab === "preferences") && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-4 right-4 z-50"
                        style={{ bottom: 'calc(83px + 16px)' }}
                    >
                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            className="w-full flex items-center justify-center active:opacity-80 transition-opacity"
                            style={{
                                height: 50,
                                borderRadius: 14,
                                background: '#007AFF',
                                color: 'white',
                                fontSize: 17,
                                fontWeight: 600,
                                letterSpacing: '-0.2px',
                                boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                                fontFamily: iOSFont,
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading
                                ? <Loader2 size={20} className="animate-spin" />
                                : activeTab === "preferences" ? "Aplicar Preferências" : "Salvar Alterações"
                            }
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
