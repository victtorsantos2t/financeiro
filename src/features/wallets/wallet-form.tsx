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
import { WalletService } from "@/services/wallet.service";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateCardGradient, getContrastColor } from "@/lib/theme-utils";

export interface Wallet {
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    card_type?: string | null;
    card_number?: string | null;
    card_limit?: number | null;
    investment_type?: string | null;
    yield_benchmark?: string | null;
    yield_percentage?: number | null;
}

interface WalletFormProps {
    wallet?: Wallet;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function WalletForm({ wallet, onSuccess, onCancel }: WalletFormProps) {
    const [name, setName] = useState(wallet?.name || "");
    const [type, setType] = useState(wallet?.type || "Corrente");
    const [color, setColor] = useState(wallet?.color || "blue");
    const [loading, setLoading] = useState(false);
    const [walletTypes, setWalletTypes] = useState<string[]>(["Corrente", "Poupança", "Investimento", "Dinheiro"]);
    const router = useRouter();
    const supabase = createClient();

    const [cardType, setCardType] = useState<string>(wallet?.card_type || "none");
    const [cardNumber, setCardNumber] = useState(wallet?.card_number || "");
    const [cardLimit, setCardLimit] = useState(wallet?.card_limit?.toString() || "");

    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, "");
        const floatValue = parseFloat(numericValue) / 100;
        return floatValue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    const parseCurrency = (value: string) => {
        return parseFloat(value.replace(/\D/g, "")) / 100;
    };

    const initialBalance = wallet?.balance
        ? wallet.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "";
    const [balanceDisplay, setBalanceDisplay] = useState(initialBalance);
    const [currentBalance, setCurrentBalance] = useState(wallet?.balance?.toString() || "");

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericOnly = rawValue.replace(/\D/g, "");

        if (numericOnly === "") {
            setBalanceDisplay("");
            setCurrentBalance("");
            return;
        }

        const formatted = formatCurrency(numericOnly);
        setBalanceDisplay(formatted);
        const floatVal = parseCurrency(formatted);
        setCurrentBalance(floatVal.toString());
    };

    const [investmentType, setInvestmentType] = useState(wallet?.investment_type || "CDB");
    const [yieldBenchmark, setYieldBenchmark] = useState(wallet?.yield_benchmark || "CDI");
    const [yieldPercentage, setYieldPercentage] = useState(wallet?.yield_percentage?.toString() || "100");

    useEffect(() => {
        if (wallet) {
            setName(wallet.name);
            setType(wallet.type);
            setCurrentBalance(wallet.balance.toString());
            setBalanceDisplay(wallet.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
            setColor(wallet.color);
            // @ts-ignore
            setCardType(wallet.card_type || "none");
            // @ts-ignore
            setCardNumber(wallet.card_number || "");
            // @ts-ignore
            setCardLimit(wallet.card_limit?.toString() || "");
            // @ts-ignore
            setInvestmentType(wallet.investment_type || "CDB");
            // @ts-ignore
            setYieldBenchmark(wallet.yield_benchmark || "CDI");
            // @ts-ignore
            setYieldPercentage(wallet.yield_percentage?.toString() || "100");
        }
        fetchWalletTypes();
    }, [wallet]);

    const fetchWalletTypes = async () => {
        try {
            const data = await WalletService.listTypes();
            if (data && data.length > 0) {
                setWalletTypes(data.map((t: any) => t.name));
            }
        } catch (error) {
            console.error("Erro ao carregar tipos de carteira:", error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const walletData = {
                name,
                type,
                balance: parseFloat(currentBalance) || 0,
                color,
                card_type: cardType === "none" ? null : cardType as any,
                card_number: cardType === "none" ? null : cardNumber,
                card_limit: cardType === "credit" ? parseFloat(cardLimit) || 0 : null,
                investment_type: type === "Investimento" ? (investmentType as any) : null,
                yield_benchmark: type === "Investimento" ? (yieldBenchmark as any) : null,
                yield_percentage: type === "Investimento" ? parseFloat(yieldPercentage) || 0 : null,
            };

            if (wallet) {
                await WalletService.update(wallet.id, walletData);
            } else {
                await WalletService.create(walletData);
            }

            toast.success(wallet ? "Carteira atualizada!" : "Carteira criada!");
            if (!wallet) {
                setName("");
                setBalanceDisplay("");
                setCurrentBalance("");
                setCardType("none");
                setCardNumber("");
                setCardLimit("");
            }
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            toast.error("Erro ao salvar carteira: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const currentGradient = generateCardGradient(color);
    const textColor = getContrastColor(color);

    return (
        <div>
            {/* Header Section with Preview */}
            <div
                className="p-8 pb-12 transition-all duration-500"
                style={{ background: currentGradient, paddingTop: 'calc(32px + env(safe-area-inset-top))' }}
            >
                <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                        {wallet ? "Editar Carteira" : "Nova Carteira"}
                    </h2>
                    <p className="opacity-80 font-medium text-sm mt-1" style={{ color: textColor }}>
                        {wallet
                            ? "Personalize os detalhes da sua conta abaixo."
                            : "Configure sua nova conta e comece a gerenciar."}
                    </p>
                </div>
            </div>

            <div className="p-8 -mt-6 bg-white dark:bg-[#1C1C1E] rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.3)] relative z-10 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome da Carteira</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Nubank, Inter, Principal"
                            className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary/20 dark:text-white transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tipo de Conta</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger id="type" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 dark:text-white transition-all font-medium">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-white/10 dark:bg-[#2C2C2E] shadow-xl">
                                    {walletTypes.map((t) => (
                                        <SelectItem key={t} value={t} className="rounded-lg dark:text-slate-200 dark:focus:bg-white/5">{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Cor do Cartão</Label>
                            <Select value={color} onValueChange={setColor}>
                                <SelectTrigger id="color" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 dark:text-white transition-all font-medium">
                                    <SelectValue placeholder="Selecione a cor" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-white/10 dark:bg-[#2C2C2E] shadow-xl max-h-[300px]">
                                    <div className="px-2 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cores Básicas</div>
                                    <SelectItem value="blue" className="rounded-lg dark:text-slate-200">Azul Digital</SelectItem>
                                    <SelectItem value="purple" className="rounded-lg dark:text-slate-200">Roxo Elite</SelectItem>
                                    <SelectItem value="green" className="rounded-lg dark:text-slate-200">Verde Invest</SelectItem>
                                    <SelectItem value="black" className="rounded-lg dark:text-slate-200">Black Card</SelectItem>
                                    <SelectItem value="slate" className="rounded-lg dark:text-slate-200">Slate Platinum</SelectItem>

                                    <div className="mt-2 px-2 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-t border-slate-100 dark:border-white/5">Bancos Nacionais</div>
                                    <SelectItem value="nubank" className="rounded-lg dark:text-slate-200">Nubank (Roxo)</SelectItem>
                                    <SelectItem value="itau" className="rounded-lg dark:text-slate-200">Itaú (Laranja)</SelectItem>
                                    <SelectItem value="inter" className="rounded-lg dark:text-slate-200">Inter (Laranja)</SelectItem>
                                    <SelectItem value="santander" className="rounded-lg dark:text-slate-200">Santander (Vermelho)</SelectItem>
                                    <SelectItem value="banco-pan" className="rounded-lg dark:text-slate-200">Banco Pan (Azul)</SelectItem>
                                    <SelectItem value="mercado-pago" className="rounded-lg dark:text-slate-200">Mercado Pago (Azul)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {type === "Investimento" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                            <Label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                                Detalhes do Investimento
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tipo de Ativo</Label>
                                    <Select value={investmentType} onValueChange={setInvestmentType}>
                                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 dark:text-white font-medium text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl dark:bg-[#2C2C2E] dark:border-white/10">
                                            <SelectItem value="CDB" className="dark:text-slate-200">CDB</SelectItem>
                                            <SelectItem value="LCI" className="dark:text-slate-200">LCI</SelectItem>
                                            <SelectItem value="LCA" className="dark:text-slate-200">LCA</SelectItem>
                                            <SelectItem value="Tesouro" className="dark:text-slate-200">Tesouro Direto</SelectItem>
                                            <SelectItem value="FII" className="dark:text-slate-200">FII</SelectItem>
                                            <SelectItem value="Ações" className="dark:text-slate-200">Ações</SelectItem>
                                            <SelectItem value="Crypto" className="dark:text-slate-200">Cripto</SelectItem>
                                            <SelectItem value="Conta Remunerada" className="dark:text-slate-200">Conta Remunerada</SelectItem>
                                            <SelectItem value="Cofrinho" className="dark:text-slate-200">Cofrinho</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Indexador</Label>
                                    <Select value={yieldBenchmark} onValueChange={setYieldBenchmark}>
                                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 dark:text-white font-medium text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl dark:bg-[#2C2C2E] dark:border-white/10">
                                            <SelectItem value="CDI" className="dark:text-slate-200">CDI</SelectItem>
                                            <SelectItem value="SELIC" className="dark:text-slate-200">SELIC</SelectItem>
                                            <SelectItem value="IPCA" className="dark:text-slate-200">IPCA</SelectItem>
                                            <SelectItem value="FIXED" className="dark:text-slate-200">Pré-fixado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                    Rentabilidade {yieldBenchmark === 'FIXED' ? '(% a.a.)' : `(% do ${yieldBenchmark})`}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={yieldPercentage}
                                        onChange={(e) => setYieldPercentage(e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 dark:text-white font-bold pl-4"
                                        placeholder="100"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-600">%</div>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                    Ex: 100% do CDI (Conta Padrão) ou 120% (Cofrinho Turbo).
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="balance" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Saldo Inicial</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-600 text-sm z-10 opacity-0">R$</span>
                            <Input
                                id="balance"
                                type="text"
                                inputMode="numeric"
                                value={balanceDisplay}
                                onChange={handleBalanceChange}
                                placeholder="R$ 0,00"
                                className="h-12 pl-4 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary/20 dark:text-white transition-all font-bold text-lg"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 mt-4">
                        <Label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-3 block">Configuração de Cartão</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Select value={cardType} onValueChange={setCardType}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 dark:text-white font-medium">
                                    <SelectValue placeholder="Possui cartão?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl dark:bg-[#2C2C2E] dark:border-white/10">
                                    <SelectItem value="none" className="dark:text-slate-200">Nenhum</SelectItem>
                                    <SelectItem value="credit" className="dark:text-slate-200">Crédito</SelectItem>
                                    <SelectItem value="debit" className="dark:text-slate-200">Débitos</SelectItem>
                                </SelectContent>
                            </Select>

                            {cardType !== "none" && (
                                <Input
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="4 dígitos finais"
                                    maxLength={4}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 dark:text-white font-medium"
                                />
                            )}
                        </div>

                        {cardType === "credit" && (
                            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="cardLimit" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Limite de Crédito</Label>
                                <Input
                                    id="cardLimit"
                                    type="number"
                                    value={cardLimit}
                                    onChange={(e) => setCardLimit(e.target.value)}
                                    placeholder="R$ 0,00"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 dark:text-white font-medium"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-2 flex flex-col md:flex-row gap-3 md:justify-end">
                    <Button
                        type="submit"
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full md:w-auto h-12 rounded-2xl bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 order-1 md:order-2"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Alterações"}
                    </Button>

                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            className="w-full md:w-auto h-12 rounded-2xl text-slate-500 dark:text-slate-400 font-bold order-2 md:order-1 hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
