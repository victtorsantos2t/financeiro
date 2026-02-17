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
import { services } from "@/core/application/services/services.factory";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle2,
    Clock,
    Type,
    DollarSign,
    Wallet,
    Tag,
    CreditCard,
    Calendar,
    Repeat,
    Loader2,
    Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

type Category = {
    id: string;
    name: string;
};

type Wallet = {
    id: string;
    name: string;
};


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
}

interface TransactionFormProps {
    className?: string;
    transaction?: Transaction;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function TransactionForm({ className, transaction, onSuccess, onCancel }: TransactionFormProps) {
    const [description, setDescription] = useState(transaction?.description || "");
    const [amount, setAmount] = useState(transaction?.amount?.toString() || "");
    const [type, setType] = useState<"income" | "expense">(transaction?.type || "expense");
    const [date, setDate] = useState(transaction?.date?.split("T")[0] || new Date().toISOString().split("T")[0]);
    const [categoryId, setCategoryId] = useState(transaction?.category_id || "");
    const [walletId, setWalletId] = useState(transaction?.wallet_id || "");
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
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        if (transaction) {
            setDescription(transaction.description);
            setAmount(transaction.amount.toString());
            setType(transaction.type);
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
        // Only auto-set status if not editing or type changed and status doesn't match logic? 
        // For simple UX, let's keep status manual or default.
        if (!transaction && type === 'income') {
            setStatus('completed');
        }
    }, [type]);

    const fetchOptions = async () => {
        try {
            const [catData, walletData] = await Promise.all([
                services.categories.list(type),
                services.wallets.getUserWallets()
            ]);

            setCategories(catData as any);
            setWallets(walletData as any);
        } catch (error) {
            console.error("Erro ao carregar opções do formulário:", error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!walletId || !categoryId || !amount || !description) {
            toast.error("Preencha todos os campos obrigatórios");
            setLoading(false);
            return;
        }

        const value = parseFloat(amount);

        const transactionData = {
            description,
            amount: value,
            type,
            date,
            category_id: categoryId,
            wallet_id: walletId,
            payment_method: paymentMethod,
            status: type === 'income' ? 'completed' : status,
            is_recurring: isRecurring,
            recurrence_interval: isRecurring ? recurrenceInterval : null as any,
        };

        try {
            if (transaction) {
                await services.transactions.registerTransaction({ id: transaction.id, ...transactionData } as any);
            } else {
                await services.transactions.registerTransaction(transactionData as any);
            }

            toast.success(transaction ? "Transação atualizada!" : "Transação criada!");

            if (!transaction) {
                setDescription("");
                setAmount("");
                setDate(new Date().toISOString().split("T")[0]);
                setCategoryId("");
                setWalletId("");
                setIsRecurring(false);
            }

            router.refresh();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error("Erro ao salvar transação: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!transaction) return;
        setLoading(true);

        try {
            await services.transactions.cancelTransaction(transaction.id);
            toast.success("Transação excluída!");
            router.refresh();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Erro ao excluir:", error);
            toast.error("Erro ao excluir transação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const LabelIcon = ({ icon: Icon }: { icon: any }) => (
        <Icon className="h-4 w-4 text-slate-400 stroke-[1.5]" />
    );

    return (
        <form onSubmit={handleSave} className={cn("flex flex-col gap-10", className)}>
            <div className="flex flex-col gap-10">
                {/* 1. HERO VALUE */}
                <div className="flex flex-col items-center justify-center py-6">
                    <Label htmlFor="amount" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Valor da Transação
                    </Label>
                    <div className="relative group flex items-center justify-center w-full max-w-[300px]">
                        <span className={cn(
                            "absolute left-0 text-3xl font-medium transition-colors duration-500",
                            type === 'income' ? 'text-blue-500' : 'text-slate-900'
                        )}>R$</span>
                        <input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0,00"
                            className={cn(
                                "w-full bg-transparent border-none text-center text-6xl font-semibold tracking-tighter focus:ring-0 placeholder:text-slate-100 transition-colors duration-500",
                                type === 'income' ? 'text-blue-600' : 'text-slate-900'
                            )}
                        />
                    </div>
                </div>

                {/* 2. REFINED SEGMENT CONTROLS */}
                <div className="space-y-6">
                    {/* Income/Expense Toggle */}
                    <div className="relative flex p-1.5 bg-slate-100/50 rounded-[22px] gap-1 overflow-hidden">
                        {/* Animated Background Indicator */}
                        <motion.div
                            className={cn(
                                "absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-[18px] shadow-sm z-0",
                                type === 'income' ? 'bg-blue-600' : 'bg-slate-900'
                            )}
                            initial={false}
                            animate={{ x: type === 'income' ? '100%' : '0%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-[18px] text-[13px] font-semibold tracking-tight transition-colors duration-300 relative z-10",
                                type === 'expense' ? 'text-white' : 'text-slate-500'
                            )}
                        >
                            Despesa
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-[18px] text-[13px] font-semibold tracking-tight transition-colors duration-300 relative z-10",
                                type === 'income' ? 'text-white' : 'text-slate-500'
                            )}
                        >
                            Receita
                        </button>
                    </div>

                    {/* Status Toggle (only for expense) */}
                    <AnimatePresence mode="wait">
                        {type === 'expense' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                className="relative flex p-1 bg-slate-50 rounded-[18px] gap-1 overflow-hidden w-full max-w-[280px] mx-auto border border-slate-100/50"
                            >
                                <motion.div
                                    className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[14px] bg-white shadow-sm z-0 border border-slate-100"
                                    initial={false}
                                    animate={{ x: status === 'pending' ? '100.5%' : '0.5%' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setStatus('completed')}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-[14px] text-[11px] font-semibold tracking-wide transition-colors duration-300 relative z-10",
                                        status === 'completed' ? 'text-slate-900' : 'text-slate-400'
                                    )}
                                >
                                    Já Pago
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('pending')}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-[14px] text-[11px] font-semibold tracking-wide transition-colors duration-300 relative z-10",
                                        status === 'pending' ? 'text-slate-900' : 'text-slate-400'
                                    )}
                                >
                                    Agendar
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. SECONDARY FIELDS GRID (8pt Based) */}
                <div className="space-y-8 bg-white/50">
                    {/* Full Width Description */}
                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                            Descrição
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Supermercado, Aluguel..."
                            className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm focus:ring-4 focus:ring-slate-100/50 text-[15px] px-6 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="wallet" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                                Carteira
                            </Label>
                            {isMobile ? (
                                <select
                                    id="wallet"
                                    value={walletId}
                                    onChange={(e) => setWalletId(e.target.value)}
                                    className="h-14 w-full rounded-2xl bg-white border border-slate-100 shadow-sm transition-all text-[14px] px-6 appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 1.5rem center',
                                        backgroundSize: '1.25rem'
                                    }}
                                >
                                    <option value="">Onde?</option>
                                    {wallets.map((wallet) => (
                                        <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <Select value={walletId} onValueChange={setWalletId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all text-[14px] px-6">
                                        <SelectValue placeholder="Onde?" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2 bg-white/98 backdrop-blur-xl">
                                        {wallets.map((wallet) => (
                                            <SelectItem key={wallet.id} value={wallet.id} className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer">{wallet.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="category" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                                Categoria
                            </Label>
                            {isMobile ? (
                                <select
                                    id="category"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="h-14 w-full rounded-2xl bg-white border border-slate-100 shadow-sm transition-all text-[14px] px-6 appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 1.5rem center',
                                        backgroundSize: '1.25rem'
                                    }}
                                >
                                    <option value="">O quê?</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all text-[14px] px-6">
                                        <SelectValue placeholder="O quê?" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2 bg-white/98 backdrop-blur-xl">
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id} className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer">{category.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="paymentMethod" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                                Método
                            </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all text-[14px] px-6">
                                    <SelectValue placeholder="Como?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[28px] border-slate-100 shadow-2xl p-2 bg-white/98 backdrop-blur-xl">
                                    <SelectItem value="pix" className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer">PIX</SelectItem>
                                    <SelectItem value="boleto" className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer">Boleto</SelectItem>
                                    <SelectItem value="card" className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer">Cartão</SelectItem>
                                    <SelectItem value="cash" className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer">Dinheiro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="date" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                                Data
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm text-[14px] px-6 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. RECURRENCE (iOS Style) */}
                <div className="pt-2">
                    <div className="flex items-center justify-between p-5 rounded-[22px] bg-slate-50 border border-slate-100/60 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100/50">
                                <Repeat className="h-4 w-4 text-slate-400 stroke-[2]" />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-slate-800 tracking-tight">Pagamento Recorrente</p>
                                <p className="text-[10px] text-slate-400 font-medium">Auto-repeat transação</p>
                            </div>
                        </div>
                        <Switch
                            checked={isRecurring}
                            onCheckedChange={setIsRecurring}
                            className="data-[state=checked]:bg-blue-600"
                        />
                    </div>

                    <AnimatePresence>
                        {isRecurring && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                            >
                                <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-100 shadow-sm px-6 text-[13px]">
                                        <SelectValue placeholder="Frequência" />
                                    </SelectTrigger>
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

            {/* 5. FLOATING PRIMARY ACTION */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-6 pb-2 mt-auto flex flex-col gap-4">
                <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full h-14 rounded-[18px] text-white font-semibold shadow-2xl transition-all flex items-center justify-center gap-2",
                        type === 'income' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-900 shadow-slate-900/10',
                        loading && "opacity-80"
                    )}
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (transaction ? "Salvar Alterações" : "Salvar Transação")}
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
