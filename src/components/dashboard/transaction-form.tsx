"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { services } from "@/core/application/services/services.factory";
import {
    Repeat,
    Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/context/dashboard-context";
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

type Category = { id: string; name: string };
type Wallet = { id: string; name: string };

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    status: "completed" | "pending";
    wallet_id: string;
    category_id: string;
    payment_method: string;
    is_recurring?: boolean;
    recurrence_interval?: string;
    destination_wallet_id?: string;
}

interface TransactionFormProps {
    className?: string;
    transaction?: Transaction;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const iOSFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif";

// ─── iOS Grouped Card ────────────────────────────────────────────────────────
function IOSCard({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="bg-white overflow-hidden"
            style={{
                borderRadius: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.08)',
            }}
        >
            {children}
        </div>
    );
}

// ─── iOS Separator ───────────────────────────────────────────────────────────
function Sep() {
    return <div style={{ height: '0.5px', background: 'rgba(60,60,67,0.12)', marginLeft: 16 }} />;
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
    return (
        <p style={{ fontSize: 13, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em', paddingLeft: 4, paddingBottom: 6, fontFamily: iOSFont }}>
            {label}
        </p>
    );
}

// ─── iOS Native Select ────────────────────────────────────────────────────────
function NativeSelect({
    id, value, onChange, placeholder, options
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            id={id}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                width: '100%',
                height: '44px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                color: value ? '#000' : '#8E8E93',
                fontFamily: iOSFont,
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingRight: 28,
                cursor: 'pointer',
            }}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({
    label, children, chevron = false
}: {
    label: string;
    children: React.ReactNode;
    chevron?: boolean;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, paddingLeft: 16, paddingRight: 12 }}>
            <span style={{ fontSize: 15, color: '#000', fontFamily: iOSFont, fontWeight: 400, flexShrink: 0, minWidth: 90 }}>
                {label}
            </span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                {children}
                {chevron && (
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0, marginLeft: 2 }}>
                        <path d="M1 1L6 6L1 11" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
        </div>
    );
}

// ─── iOS Segmented Control ────────────────────────────────────────────────────
function IOSSegmented<T extends string>({
    options, value, onChange, colorMap
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
    colorMap?: Record<string, string>;
}) {
    const activeColor = colorMap?.[value] ?? '#3B82F6';
    return (
        <div
            style={{
                display: 'flex',
                background: 'rgba(118,118,128,0.12)',
                borderRadius: 10,
                padding: 3,
                gap: 2,
            }}
        >
            {options.map(opt => {
                const isActive = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        style={{
                            flex: 1,
                            height: 32,
                            borderRadius: 8,
                            background: isActive ? '#fff' : 'transparent',
                            boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.07)' : 'none',
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? activeColor : '#3C3C43',
                            fontFamily: iOSFont,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.15s, box-shadow 0.15s',
                            letterSpacing: '-0.1px',
                        }}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export function TransactionForm({ className, transaction, onSuccess, onCancel }: TransactionFormProps) {
    const [description, setDescription] = useState(transaction?.description || "");
    const [amount, setAmount] = useState(
        transaction?.amount
            ? transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : ""
    );
    const [type, setType] = useState<"income" | "expense" | "transfer">(transaction?.type as any || "expense");
    const [date, setDate] = useState(transaction?.date?.split("T")[0] || format(new Date(), "yyyy-MM-dd"));
    const [categoryId, setCategoryId] = useState(transaction?.category_id || "");
    const [walletId, setWalletId] = useState(transaction?.wallet_id || "");
    const [destinationWalletId, setDestinationWalletId] = useState(transaction?.destination_wallet_id || "");
    const [paymentMethod, setPaymentMethod] = useState<string>(transaction?.payment_method || "card");
    const [status, setStatus] = useState<"completed" | "pending">(transaction?.status || "completed");
    const [isRecurring, setIsRecurring] = useState(transaction?.is_recurring || false);
    const [recurrenceInterval, setRecurrenceInterval] = useState(transaction?.recurrence_interval || "monthly");
    const [categories, setCategories] = useState<Category[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => { fetchOptions(); }, []);

    useEffect(() => {
        if (transaction) {
            setDescription(transaction.description);
            setAmount(transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            setType(transaction.type as any);
            setDate(transaction.date.split("T")[0]);
            setCategoryId(transaction.category_id);
            setWalletId(transaction.wallet_id);
            setPaymentMethod(transaction.payment_method || "card");
            setStatus(transaction.status);
            setIsRecurring(transaction.is_recurring || false);
            setRecurrenceInterval(transaction.recurrence_interval || "monthly");
        }
    }, [transaction]);

    useEffect(() => {
        fetchOptions();
        if (!transaction && type === 'income') setStatus('completed');
    }, [type]);

    const fetchOptions = async () => {
        try {
            const [catData, walletData] = await Promise.all([
                services.categories.list(type),
                services.wallets.getUserWallets(),
            ]);
            setCategories(catData as any);
            setWallets(walletData as any);
        } catch (err) { console.error(err); }
    };

    const { refreshData } = useDashboard();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const isTransfer = type === 'transfer';
        if (!walletId || (!categoryId && !isTransfer) || !amount || !description) {
            toast.error("Preencha todos os campos obrigatórios");
            setLoading(false); return;
        }
        if (isTransfer && !destinationWalletId) {
            toast.error("Selecione a conta de destino");
            setLoading(false); return;
        }
        if (isTransfer && walletId === destinationWalletId) {
            toast.error("A conta de destino não pode ser a mesma de origem");
            setLoading(false); return;
        }
        const value = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
        const transactionData = {
            description, amount: value, type, date,
            category_id: isTransfer ? null : categoryId,
            wallet_id: walletId,
            destination_wallet_id: isTransfer ? destinationWalletId : null,
            payment_method: paymentMethod,
            status: (type === 'income' || type === 'transfer') ? 'completed' : status,
            is_recurring: isRecurring,
            recurrence_interval: isRecurring ? recurrenceInterval : null as any,
        };
        try {
            if (transaction) {
                await services.transactions.registerTransaction({ id: transaction.id, ...transactionData } as any);
            } else {
                await services.transactions.registerTransaction(transactionData as any);
            }
            toast.success(transaction ? "Transação atualizada!" : isTransfer ? "Transferência Realizada!" : "Transação criada!");
            if (!transaction) {
                setDescription(""); setAmount(""); setDate(format(new Date(), "yyyy-MM-dd"));
                setCategoryId(""); setWalletId(""); setDestinationWalletId(""); setIsRecurring(false);
            }
            refreshData(); router.refresh();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao salvar transação: " + error.message);
        } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!transaction) return;
        setLoading(true);
        try {
            await services.transactions.cancelTransaction(transaction.id);
            toast.success("Transação excluída!");
            refreshData(); router.refresh();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error("Erro ao excluir transação. Tente novamente.");
        } finally { setLoading(false); }
    };

    // ── Color based on type ──────────────────────────────────────────────────
    const typeColor = type === 'income' ? '#3B82F6' : type === 'transfer' ? '#8B5CF6' : '#1C1C1E';
    const saveBg = type === 'income' ? '#3B82F6' : type === 'transfer' ? '#8B5CF6' : '#1C1C1E';

    // ── Mobile layout ─────────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <form
                onSubmit={handleSave}
                style={{ fontFamily: iOSFont, display: 'flex', flexDirection: 'column', gap: 24 }}
            >
                {/* VALOR HERO */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}>
                    <p style={{ fontSize: 12, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 500 }}>
                        Valor da Transação
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'center' }}>
                        <span style={{ fontSize: 28, fontWeight: 300, color: amount ? typeColor : '#C7C7CC', letterSpacing: '-0.5px' }}>R$</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={e => {
                                let v = e.target.value.replace(/\D/g, "");
                                if (v === "") { setAmount(""); return; }
                                const num = parseFloat(v) / 100;
                                setAmount(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }}
                            placeholder="0,00"
                            style={{
                                fontSize: 52,
                                fontWeight: 300,
                                color: amount ? typeColor : '#C7C7CC',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                letterSpacing: '-1px',
                                width: '180px',
                                textAlign: 'center',
                                fontFamily: iOSFont,
                                caretColor: typeColor,
                            }}
                        />
                    </div>
                </div>

                {/* TIPO — iOS Segmented Control */}
                <IOSSegmented
                    options={[
                        { value: 'expense', label: 'Despesa' },
                        { value: 'transfer', label: 'Transferência' },
                        { value: 'income', label: 'Receita' },
                    ]}
                    value={type}
                    onChange={v => setType(v as any)}
                    colorMap={{ expense: '#1C1C1E', transfer: '#8B5CF6', income: '#3B82F6' }}
                />

                {/* STATUS (só para despesa) */}
                <AnimatePresence>
                    {type === 'expense' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <IOSSegmented
                                options={[
                                    { value: 'completed', label: '✓ Já Pago' },
                                    { value: 'pending', label: '⏰ Agendar' },
                                ]}
                                value={status}
                                onChange={v => setStatus(v as any)}
                                colorMap={{ completed: '#34C759', pending: '#FF9500' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* DESCRIÇÃO */}
                <div>
                    <SectionLabel label="Descrição" />
                    <IOSCard>
                        <div style={{ padding: '0 16px' }}>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ex: Supermercado, Aluguel..."
                                style={{
                                    width: '100%',
                                    height: 44,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: 15,
                                    color: '#000',
                                    fontFamily: iOSFont,
                                    caretColor: '#3B82F6',
                                }}
                            />
                        </div>
                    </IOSCard>
                </div>

                {/* CARTEIRA + CATEGORIA / DESTINO */}
                <div>
                    <SectionLabel label={type === 'transfer' ? 'Transferência' : 'Detalhes'} />
                    <IOSCard>
                        <FieldRow label={type === 'transfer' ? 'De onde sai' : 'Carteira'} chevron>
                            <NativeSelect
                                id="wallet"
                                value={walletId}
                                onChange={setWalletId}
                                placeholder="Selecione..."
                                options={wallets.map(w => ({ value: w.id, label: w.name }))}
                            />
                        </FieldRow>
                        <Sep />
                        {type === 'transfer' ? (
                            <FieldRow label="Para onde vai" chevron>
                                <NativeSelect
                                    id="dest_wallet"
                                    value={destinationWalletId}
                                    onChange={setDestinationWalletId}
                                    placeholder="Selecione..."
                                    options={wallets.filter(w => w.id !== walletId).map(w => ({ value: w.id, label: w.name }))}
                                />
                            </FieldRow>
                        ) : (
                            <FieldRow label="Categoria" chevron>
                                <NativeSelect
                                    id="category"
                                    value={categoryId}
                                    onChange={setCategoryId}
                                    placeholder="O quê?"
                                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                                />
                            </FieldRow>
                        )}
                    </IOSCard>
                </div>

                {/* MÉTODO + DATA */}
                <div>
                    <SectionLabel label="Pagamento" />
                    <IOSCard>
                        <FieldRow label="Método" chevron>
                            <NativeSelect
                                id="payment"
                                value={paymentMethod}
                                onChange={setPaymentMethod}
                                placeholder="Como?"
                                options={[
                                    { value: 'pix', label: 'PIX' },
                                    { value: 'boleto', label: 'Boleto' },
                                    { value: 'card', label: 'Cartão' },
                                    { value: 'cash', label: 'Dinheiro' },
                                ]}
                            />
                        </FieldRow>
                        <Sep />
                        <FieldRow label="Data">
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: 15,
                                    color: '#3C3C43',
                                    fontFamily: iOSFont,
                                    textAlign: 'right',
                                    cursor: 'pointer',
                                    maxWidth: 140,
                                }}
                            />
                        </FieldRow>
                    </IOSCard>
                </div>

                {/* RECORRÊNCIA */}
                <div>
                    <SectionLabel label="Recorrência" />
                    <IOSCard>
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 12, minHeight: 50 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                <Repeat size={17} style={{ color: '#3B82F6', flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 15, color: '#000', fontFamily: iOSFont, fontWeight: 400 }}>Pagamento Recorrente</p>
                                    <p style={{ fontSize: 12, color: '#8E8E93', fontFamily: iOSFont }}>Auto-repeat transação</p>
                                </div>
                            </div>
                            <Switch
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                                className="data-[state=checked]:bg-blue-600 scale-90"
                            />
                        </div>

                        <AnimatePresence>
                            {isRecurring && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <Sep />
                                    <FieldRow label="Frequência" chevron>
                                        <NativeSelect
                                            id="recurrence"
                                            value={recurrenceInterval}
                                            onChange={setRecurrenceInterval}
                                            placeholder="Frequência"
                                            options={[
                                                { value: 'daily', label: 'Diária' },
                                                { value: 'weekly', label: 'Semanal' },
                                                { value: 'monthly', label: 'Mensal' },
                                                { value: 'yearly', label: 'Anual' },
                                            ]}
                                        />
                                    </FieldRow>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </IOSCard>
                </div>

                {/* BOTÃO SALVAR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            height: 50,
                            borderRadius: 14,
                            background: saveBg,
                            color: 'white',
                            fontSize: 17,
                            fontWeight: 600,
                            letterSpacing: '-0.2px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: iOSFont,
                            boxShadow: `0 4px 16px ${saveBg}40`,
                        }}
                    >
                        {loading
                            ? <Loader2 size={20} className="animate-spin" />
                            : transaction ? "Salvar Alterações"
                                : type === 'transfer' ? "Confirmar Transferência"
                                    : "Salvar Transação"
                        }
                    </button>

                    {transaction && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    type="button"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#FF3B30',
                                        fontSize: 15,
                                        fontFamily: iOSFont,
                                        cursor: 'pointer',
                                        paddingTop: 4,
                                        paddingBottom: 4,
                                    }}
                                >
                                    Excluir Transação
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[24px] border-none p-8 shadow-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-semibold tracking-tight">Excluir Transação?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500 text-[14px] leading-relaxed">
                                        Esta ação é permanente e não poderá ser desfeita nos seus registros financeiros.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-6 gap-3">
                                    <AlertDialogCancel className="h-12 rounded-2xl bg-slate-50 border-none text-slate-500 font-semibold">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 border-none font-semibold">
                                        Sim, Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </form>
        );
    }

    // ── Desktop layout (mantém o original) ────────────────────────────────────
    return (
        <form onSubmit={handleSave} className={cn("flex flex-col gap-10", className)}>
            <div className="flex flex-col gap-10">
                {/* 1. HERO VALUE */}
                <div className="flex flex-col items-center justify-center py-6">
                    <label htmlFor="amount" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Valor da Transação
                    </label>
                    <div className="relative group flex items-center justify-center w-full max-w-[300px]">
                        <span className={cn(
                            "absolute left-4 text-3xl font-medium transition-colors duration-500",
                            type === 'income' ? 'text-blue-500' : type === 'transfer' ? 'text-violet-500' : 'text-slate-900',
                            !amount && "opacity-50"
                        )}>R$</span>
                        <input
                            id="amount" type="text" inputMode="numeric"
                            value={amount}
                            onChange={e => {
                                let v = e.target.value.replace(/\D/g, "");
                                if (v === "") { setAmount(""); return; }
                                const num = parseFloat(v) / 100;
                                setAmount(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }}
                            placeholder="0,00"
                            className={cn(
                                "w-full bg-transparent border-none text-center text-6xl font-semibold tracking-tighter focus:ring-0 placeholder:text-slate-100 transition-colors duration-500 pl-12",
                                type === 'income' ? 'text-blue-600' : type === 'transfer' ? 'text-violet-600' : 'text-slate-900'
                            )}
                        />
                    </div>
                </div>

                {/* 2. SEGMENT CONTROLS */}
                <div className="space-y-6">
                    <div className="relative flex p-1.5 bg-slate-100/50 rounded-[22px] gap-1 overflow-hidden">
                        <motion.div
                            className={cn(
                                "absolute top-1.5 bottom-1.5 left-1.5 w-[calc(33.33%-4px)] rounded-[18px] shadow-sm z-0",
                                type === 'income' ? 'bg-blue-600' : type === 'expense' ? 'bg-slate-900' : 'bg-violet-600'
                            )}
                            initial={false}
                            animate={{ x: type === 'income' ? '200%' : type === 'transfer' ? '100%' : '0%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        {(['expense', 'transfer', 'income'] as const).map((t, i) => (
                            <button key={t} type="button" onClick={() => setType(t)}
                                className={cn("flex-1 py-3 px-4 rounded-[18px] text-[13px] font-semibold tracking-tight transition-colors duration-300 relative z-10",
                                    type === t ? 'text-white' : 'text-slate-500')}>
                                {t === 'expense' ? 'Despesa' : t === 'transfer' ? 'Transferência' : 'Receita'}
                            </button>
                        ))}
                    </div>
                    <AnimatePresence mode="wait">
                        {type === 'expense' && (
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }} transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                className="relative flex p-1 bg-slate-50 rounded-[18px] gap-1 overflow-hidden w-full max-w-[280px] mx-auto border border-slate-100/50">
                                <motion.div className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[14px] bg-white shadow-sm z-0 border border-slate-100"
                                    initial={false} animate={{ x: status === 'pending' ? '100.5%' : '0.5%' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                                {(['completed', 'pending'] as const).map(s => (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={cn("flex-1 py-2 px-3 rounded-[14px] text-[11px] font-semibold tracking-wide transition-colors duration-300 relative z-10",
                                            status === s ? 'text-slate-900' : 'text-slate-400')}>
                                        {s === 'completed' ? 'Já Pago' : 'Agendar'}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. FIELDS */}
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label htmlFor="description" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Descrição</label>
                        <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Ex: Supermercado, Aluguel..."
                            className="h-14 w-full rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-4 focus:ring-slate-100/50 text-[15px] px-6 transition-all outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">{type === 'transfer' ? 'De onde sai?' : 'Carteira'}</label>
                            <Select value={walletId} onValueChange={setWalletId}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all text-[14px] px-6"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2">
                                    {wallets.map(w => <SelectItem key={w.id} value={w.id} className="rounded-xl py-3">{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {type === 'transfer' ? (
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Para onde vai?</label>
                                <Select value={destinationWalletId} onValueChange={setDestinationWalletId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all text-[14px] px-6"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2">
                                        {wallets.filter(w => w.id !== walletId).map(w => <SelectItem key={w.id} value={w.id} className="rounded-xl py-3">{w.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Categoria</label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all text-[14px] px-6"><SelectValue placeholder="O quê?" /></SelectTrigger>
                                    <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2">
                                        {categories.map(c => <SelectItem key={c.id} value={c.id} className="rounded-xl py-3">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Método</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all text-[14px] px-6"><SelectValue placeholder="Como?" /></SelectTrigger>
                                <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2">
                                    <SelectItem value="pix" className="rounded-xl py-3">PIX</SelectItem>
                                    <SelectItem value="boleto" className="rounded-xl py-3">Boleto</SelectItem>
                                    <SelectItem value="card" className="rounded-xl py-3">Cartão</SelectItem>
                                    <SelectItem value="cash" className="rounded-xl py-3">Dinheiro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Data</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                className="h-14 w-full rounded-2xl bg-white border border-slate-100 shadow-sm text-[14px] px-6 transition-all outline-none" />
                        </div>
                    </div>
                </div>

                {/* 4. RECURRENCE */}
                <div className="pt-2">
                    <div className="flex items-center justify-between p-5 rounded-[22px] bg-slate-50 border border-slate-100/60">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100/50">
                                <Repeat className="h-4 w-4 text-slate-400 stroke-[2]" />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-slate-800 tracking-tight">Pagamento Recorrente</p>
                                <p className="text-[10px] text-slate-400 font-medium">Auto-repeat transação</p>
                            </div>
                        </div>
                        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} className="data-[state=checked]:bg-blue-600" />
                    </div>
                    <AnimatePresence>
                        {isRecurring && (
                            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden">
                                <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-100 shadow-sm px-6 text-[13px]"><SelectValue placeholder="Frequência" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl border-slate-50">
                                        <SelectItem value="daily" className="rounded-lg py-2">Diária</SelectItem>
                                        <SelectItem value="weekly" className="rounded-lg py-2">Semanal</SelectItem>
                                        <SelectItem value="monthly" className="rounded-lg py-2">Mensal</SelectItem>
                                        <SelectItem value="yearly" className="rounded-lg py-2">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 5. ACTIONS */}
            <div className="pt-8 pb-4 mt-auto flex flex-col gap-4">
                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className={cn("w-full h-14 rounded-[18px] text-white font-semibold shadow-2xl transition-all flex items-center justify-center gap-2",
                        type === 'income' ? 'bg-blue-600 shadow-blue-500/20' : type === 'transfer' ? 'bg-violet-600 shadow-violet-500/20' : 'bg-slate-900 shadow-slate-900/10',
                        loading && "opacity-80")}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (transaction ? "Salvar Alterações" : type === 'transfer' ? "Confirmar Transferência" : "Salvar Transação")}
                </motion.button>
                {transaction && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button type="button" className="text-[11px] font-bold text-red-400 hover:text-red-500 uppercase tracking-widest text-center py-2 transition-colors">
                                Excluir Transação
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[32px] border-none p-10 shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-semibold tracking-tight">Excluir Transação?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 text-[14px] leading-relaxed">
                                    Esta ação é permanente e não poderá ser desfeita nos seus registros financeiros.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-8 gap-3">
                                <AlertDialogCancel className="h-12 rounded-2xl bg-slate-50 border-none text-slate-500 font-semibold hover:bg-slate-100">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 border-none font-semibold">
                                    Sim, Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </form>
    );
}
