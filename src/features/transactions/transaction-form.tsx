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
    recurrence_end_date?: string;
    destination_wallet_id?: string;
}

interface TransactionFormProps {
    className?: string;
    transaction?: Transaction;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const iOSFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif";

// ─── Brutalist Card ────────────────────────────────────────────────────────
function IOSCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-background border-2 border-border rounded-none shadow-none overflow-hidden">
            {children}
        </div>
    );
}

// ─── Brutalist Separator ───────────────────────────────────────────────────────────
function Sep() {
    return <div className="h-px bg-border" />;
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
    return (
        <p className="text-[10px] font-black text-foreground uppercase tracking-widest pl-1 pb-2">
            {label}
        </p>
    );
}

// ─── Brutalist Native Select ────────────────────────────────────────────────────────
function NativeSelect({
    id, value, onChange, placeholder, options
}: {
    id: string; value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[];
}) {
    return (
        <select
            id={id} value={value} onChange={e => onChange(e.target.value)}
            className="w-full h-[42px] bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-foreground appearance-none cursor-pointer text-right focus:ring-0"
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({ label, children, chevron = false }: { label: string; children: React.ReactNode; chevron?: boolean; }) {
    return (
        <div className="flex items-center min-h-[42px] px-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex-shrink-0 min-w-[90px]">{label}</span>
            <div className="flex-1 flex items-center justify-end gap-1">
                {children}
            </div>
        </div>
    );
}

// ─── Brutalist Segmented Control ────────────────────────────────────────────────────
function IOSSegmented<T extends string>({
    options, value, onChange, colorMap
}: {
    options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; colorMap?: Record<string, string>;
}) {
    return (
        <div className="flex bg-background border-2 border-border rounded-none p-1 gap-1">
            {options.map(opt => {
                const isActive = opt.value === value;
                return (
                    <button
                        key={opt.value} type="button" onClick={() => onChange(opt.value)}
                        className={cn(
                            "flex-1 h-[42px] rounded-none text-[10px] uppercase tracking-widest font-black transition-all border border-transparent cursor-pointer",
                            isActive ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground hover:text-foreground border-transparent"
                        )}
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
    const [recurrenceEndDate, setRecurrenceEndDate] = useState(transaction?.recurrence_end_date || "");
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
            setRecurrenceEndDate(transaction.recurrence_end_date || "");
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
            recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null as any,
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
    const typeColor = type === 'income' ? '#3B82F6' : type === 'transfer' ? '#14B8A6' : '#1C1C1E';
    const saveBg = type === 'income' ? '#3B82F6' : type === 'transfer' ? '#14B8A6' : '#1C1C1E';

    // ── Mobile layout ─────────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <form
                onSubmit={handleSave}
                className="flex flex-col gap-6"
            >
                {/* VALOR HERO */}
                <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                        Valor da Transação
                    </p>
                    <div className="relative flex items-center justify-center w-full max-w-[280px] mx-auto">
                        <span className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black transition-colors duration-300 select-none",
                            amount ? (type === 'income' ? 'text-blue-500' : type === 'transfer' ? 'text-teal-500' : 'text-foreground') : 'text-muted-foreground/30'
                        )}>R$</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={e => {
                                const v = e.target.value.replace(/\D/g, "");
                                if (v === "") { setAmount(""); return; }
                                const num = parseFloat(v) / 100;
                                setAmount(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }}
                            placeholder="0,00"
                            className={cn(
                                "w-full text-center bg-transparent border-none outline-none text-5xl font-black tracking-tighter transition-colors duration-300 focus:ring-0 placeholder:text-muted-foreground/20 py-2 pl-12 pr-4",
                                amount ? (type === 'income' ? 'text-blue-600' : type === 'transfer' ? 'text-teal-600' : 'text-foreground') : 'text-muted-foreground/30'
                            )}
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
                    colorMap={{ expense: '#1C1C1E', transfer: '#14B8A6', income: '#3B82F6' }}
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
                        <div className="px-4">
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ex: Supermercado, Aluguel..."
                                className="w-full h-[42px] bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-foreground focus:ring-0"
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
                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-foreground text-right w-[140px] appearance-none cursor-pointer focus:ring-0"
                            />
                        </FieldRow>
                    </IOSCard>
                </div>

                {/* RECORRÊNCIA */}
                <div>
                    <SectionLabel label="Recorrência" />
                    <IOSCard>
                        <div className="flex items-center min-h-[42px] px-4 py-2">
                            <div className="flex items-center gap-2 flex-1">
                                <Repeat className="w-4 h-4 text-foreground flex-shrink-0" />
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none">Pagamento Recorrente</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Auto-repeat transação</p>
                                </div>
                            </div>
                            <Switch
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                                className="scale-90"
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
                                    <Sep />
                                    <FieldRow label="Repetir até">
                                        <input
                                            type="date"
                                            value={recurrenceEndDate}
                                            onChange={e => setRecurrenceEndDate(e.target.value)}
                                            placeholder="Indefinido"
                                            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-foreground text-right w-[140px] appearance-none cursor-pointer focus:ring-0"
                                        />
                                    </FieldRow>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </IOSCard>
                </div>

                {/* BOTÃO SALVAR */}
                <div className="flex flex-col gap-3 pb-2 pt-4">
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "w-full h-[42px] rounded-none flex items-center justify-center font-black uppercase tracking-widest text-[10px] text-background transition-all shadow-none border",
                            type === 'income' ? 'bg-[#3B82F6] border-[#3B82F6] hover:bg-[#3B82F6]/90' :
                                type === 'transfer' ? 'bg-[#14B8A6] border-[#14B8A6] hover:bg-[#14B8A6]/90' :
                                    'bg-foreground border-foreground hover:bg-foreground/90'
                        )}
                    >
                        {loading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : transaction ? "Salvar Alterações"
                                : type === 'transfer' ? "Confirmar Transferência"
                                    : "Salvar Transação"
                        }
                    </motion.button>

                    {transaction && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    type="button"
                                    className="bg-transparent border-none text-destructive text-[10px] font-black uppercase tracking-widest cursor-pointer py-2 hover:opacity-80 transition-opacity"
                                >
                                    Excluir Transação
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-none border-2 border-border p-8 shadow-none bg-card">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-sm font-black uppercase tracking-widest text-foreground">Excluir Transação?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider leading-relaxed mt-2">
                                        Esta ação é permanente e não poderá ser desfeita nos seus registros financeiros.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-6 gap-3">
                                    <AlertDialogCancel className="h-[42px] rounded-none border border-border bg-transparent text-foreground hover:bg-secondary font-black uppercase tracking-widest text-[10px]">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="h-[42px] rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive font-black uppercase tracking-widest text-[10px]">
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
        <form onSubmit={handleSave} className={cn("flex flex-col gap-8 h-full", className)}>
            <div className="flex flex-col gap-8 flex-1">
                {/* 1. HERO VALUE */}
                <div className="flex flex-col items-center justify-center py-4">
                    <label htmlFor="amount" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                        Valor da Transação
                    </label>
                    <div className="relative flex items-center justify-center w-full max-w-[340px] mx-auto">
                        <span className={cn(
                            "absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black transition-colors duration-500 select-none",
                            type === 'income' ? 'text-blue-500' : type === 'transfer' ? 'text-teal-500' : 'text-foreground',
                            !amount && "opacity-30"
                        )}>R$</span>
                        <input
                            id="amount" type="text" inputMode="numeric"
                            value={amount}
                            onChange={e => {
                                const v = e.target.value.replace(/\D/g, "");
                                if (v === "") { setAmount(""); return; }
                                const num = parseFloat(v) / 100;
                                setAmount(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }}
                            placeholder="0,00"
                            className={cn(
                                "w-full bg-transparent border-none outline-none text-center text-6xl font-black tracking-tighter focus:ring-0 placeholder:text-muted-foreground/20 transition-colors duration-500 py-2 pl-16 pr-6",
                                type === 'income' ? 'text-blue-600' : type === 'transfer' ? 'text-teal-600' : 'text-foreground',
                                !amount && "text-muted-foreground/30"
                            )}
                        />
                    </div>
                </div>

                {/* 2. SEGMENT CONTROLS */}
                <div className="space-y-4">
                    <div className="flex bg-background border-2 border-border rounded-none p-1 gap-1 w-full">
                        {(['expense', 'transfer', 'income'] as const).map((t) => (
                            <button key={t} type="button" onClick={() => setType(t)}
                                className={cn("flex-1 py-3 px-4 rounded-none text-[10px] font-black uppercase tracking-widest transition-all border border-transparent cursor-pointer",
                                    type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/50')}>
                                {t === 'expense' ? 'Despesa' : t === 'transfer' ? 'Transferência' : 'Receita'}
                            </button>
                        ))}
                    </div>
                    <AnimatePresence mode="wait">
                        {type === 'expense' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex bg-background border-2 border-border rounded-none p-1 gap-1 w-full max-w-[280px] mx-auto overflow-hidden">
                                {(['completed', 'pending'] as const).map(s => (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={cn("flex-1 py-2 px-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all border border-transparent cursor-pointer",
                                            status === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/50')}>
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
                        <label htmlFor="description" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descrição</label>
                        <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Ex: Supermercado, Aluguel..."
                            className="h-[42px] w-full rounded-none bg-transparent border-2 border-border focus:border-primary text-foreground text-[10px] font-black uppercase tracking-widest px-4 transition-all outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{type === 'transfer' ? 'De onde sai?' : 'Carteira'}</label>
                            <Select value={walletId} onValueChange={setWalletId}>
                                <SelectTrigger className="h-[42px] rounded-none bg-transparent border-2 border-border shadow-none transition-all text-[10px] font-black uppercase tracking-widest px-4 text-foreground focus:ring-0"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="rounded-none border-2 border-border shadow-none p-0 bg-card">
                                    {wallets.map(w => <SelectItem key={w.id} value={w.id} className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {type === 'transfer' ? (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Para onde vai?</label>
                                <Select value={destinationWalletId} onValueChange={setDestinationWalletId}>
                                    <SelectTrigger className="h-[42px] rounded-none bg-transparent border-2 border-border shadow-none transition-all text-[10px] font-black uppercase tracking-widest px-4 text-foreground focus:ring-0"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="rounded-none border-2 border-border shadow-none p-0 bg-card">
                                        {wallets.filter(w => w.id !== walletId).map(w => <SelectItem key={w.id} value={w.id} className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">{w.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Categoria</label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="h-[42px] rounded-none bg-transparent border-2 border-border shadow-none transition-all text-[10px] font-black uppercase tracking-widest px-4 text-foreground focus:ring-0"><SelectValue placeholder="O quê?" /></SelectTrigger>
                                    <SelectContent className="rounded-none border-2 border-border shadow-none p-0 bg-card">
                                        {categories.map(c => <SelectItem key={c.id} value={c.id} className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Método</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-[42px] rounded-none bg-transparent border-2 border-border shadow-none transition-all text-[10px] font-black uppercase tracking-widest px-4 text-foreground focus:ring-0"><SelectValue placeholder="Como?" /></SelectTrigger>
                                <SelectContent className="rounded-none border-2 border-border shadow-none p-0 bg-card">
                                    <SelectItem value="pix" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">PIX</SelectItem>
                                    <SelectItem value="boleto" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">Boleto</SelectItem>
                                    <SelectItem value="card" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">Cartão</SelectItem>
                                    <SelectItem value="cash" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">Dinheiro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                className="h-[42px] w-full rounded-none bg-transparent border-2 border-border shadow-none text-[10px] font-black uppercase tracking-widest px-4 transition-all outline-none text-foreground dark:[color-scheme:dark] focus:border-primary cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* 4. RECURRENCE */}
                <div className="pt-2">
                    <div className="flex items-center justify-between p-4 rounded-none bg-background border-2 border-border">
                        <div className="flex items-center gap-4">
                            <Repeat className="h-4 w-4 text-foreground stroke-[2] flex-shrink-0" />
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none">Pagamento Recorrente</p>
                                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Auto-repeat transação</p>
                            </div>
                        </div>
                        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} className="scale-90" />
                    </div>
                    <AnimatePresence>
                        {isRecurring && (
                            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden">
                                <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                                    <SelectTrigger className="h-[42px] rounded-none bg-transparent border-2 border-border shadow-none px-4 text-[10px] font-black uppercase tracking-widest text-foreground focus:ring-0"><SelectValue placeholder="Frequência" /></SelectTrigger>
                                    <SelectContent className="rounded-none shadow-none border-2 border-border bg-card p-0">
                                        <SelectItem value="daily" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">Diária</SelectItem>
                                        <SelectItem value="weekly" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">Semanal</SelectItem>
                                        <SelectItem value="monthly" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">Mensal</SelectItem>
                                        <SelectItem value="yearly" className="rounded-none py-3 text-[10px] font-black uppercase tracking-widest">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="mt-3 space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Repetir até (opcional)</label>
                                    <input
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={e => setRecurrenceEndDate(e.target.value)}
                                        className="h-[42px] w-full rounded-none bg-transparent border-2 border-border shadow-none text-[10px] font-black uppercase tracking-widest px-4 transition-all outline-none text-foreground dark:[color-scheme:dark] focus:border-primary cursor-pointer"
                                    />
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Deixe em branco para repetir indefinidamente</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 5. ACTIONS */}
            <div className="pt-8 pb-4 mt-auto flex flex-col gap-4">
                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.95 }}
                    className={cn("w-full h-[42px] rounded-none text-background font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border shadow-none",
                        type === 'income' ? 'bg-[#3B82F6] border-[#3B82F6] hover:bg-[#3B82F6]/90' : type === 'transfer' ? 'bg-[#14B8A6] border-[#14B8A6] hover:bg-[#14B8A6]/90' : 'bg-foreground border-foreground hover:bg-foreground/90',
                        loading && "opacity-80")}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (transaction ? "Salvar Alterações" : type === 'transfer' ? "Confirmar Transferência" : "Salvar Transação")}
                </motion.button>
                {transaction && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button type="button" className="text-[10px] font-black text-destructive hover:opacity-80 uppercase tracking-widest text-center py-2 transition-opacity bg-transparent border-none">
                                Excluir Transação
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none border-2 border-border p-10 shadow-none bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm font-black uppercase tracking-widest text-foreground">Excluir Transação?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider leading-relaxed mt-2">
                                    Esta ação é permanente e não poderá ser desfeita nos seus registros financeiros.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-8 gap-3">
                                <AlertDialogCancel className="h-[42px] rounded-none border border-border bg-transparent text-foreground hover:bg-secondary font-black uppercase tracking-widest text-[10px]">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="h-[42px] rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive font-black uppercase tracking-widest text-[10px]">
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

// aria-label
