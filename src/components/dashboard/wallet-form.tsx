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
    card_type?: string;
    card_number?: string;
    card_limit?: number;
}

interface WalletFormProps {
    wallet?: Wallet;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function WalletForm({ wallet, onSuccess, onCancel }: WalletFormProps) {
    const [name, setName] = useState(wallet?.name || "");
    const [type, setType] = useState(wallet?.type || "Corrente");
    const [balance, setBalance] = useState(wallet?.balance?.toString() || "");
    const [color, setColor] = useState(wallet?.color || "blue");
    const [loading, setLoading] = useState(false);
    const [walletTypes, setWalletTypes] = useState<string[]>(["Corrente", "Poupança", "Investimento", "Dinheiro"]);
    const router = useRouter();
    const supabase = createClient();

    const [cardType, setCardType] = useState<string>(wallet?.card_type || "none");
    const [cardNumber, setCardNumber] = useState(wallet?.card_number || "");
    const [cardLimit, setCardLimit] = useState(wallet?.card_limit?.toString() || "");

    useEffect(() => {
        if (wallet) {
            setName(wallet.name);
            setType(wallet.type);
            setBalance(wallet.balance.toString());
            setColor(wallet.color);
            // @ts-ignore
            setCardType(wallet.card_type || "none");
            // @ts-ignore
            setCardNumber(wallet.card_number || "");
            // @ts-ignore
            setCardLimit(wallet.card_limit?.toString() || "");
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
                balance: parseFloat(balance) || 0,
                color,
                card_type: cardType === "none" ? null : cardType as any,
                card_number: cardType === "none" ? null : cardNumber,
                card_limit: cardType === "credit" ? parseFloat(cardLimit) || 0 : null,
            };

            if (wallet) {
                await WalletService.update(wallet.id, walletData);
            } else {
                await WalletService.create(walletData);
            }

            toast.success(wallet ? "Carteira atualizada!" : "Carteira criada!");
            if (!wallet) {
                setName("");
                setBalance("");
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
                style={{ background: currentGradient }}
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

            <div className="p-8 -mt-6 bg-white rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] relative z-10 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Carteira</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Nubank, Inter, Principal"
                            className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Conta</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger id="type" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    {walletTypes.map((t) => (
                                        <SelectItem key={t} value={t} className="rounded-lg">{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cor do Cartão</Label>
                            <Select value={color} onValueChange={setColor}>
                                <SelectTrigger id="color" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium">
                                    <SelectValue placeholder="Selecione a cor" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl max-h-[300px]">
                                    <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Cores Básicas</div>
                                    <SelectItem value="blue" className="rounded-lg">Azul Digital</SelectItem>
                                    <SelectItem value="purple" className="rounded-lg">Roxo Elite</SelectItem>
                                    <SelectItem value="green" className="rounded-lg">Verde Invest</SelectItem>
                                    <SelectItem value="black" className="rounded-lg">Black Card</SelectItem>
                                    <SelectItem value="gray" className="rounded-lg">Cinza Platinum</SelectItem>

                                    <div className="mt-2 px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">Bancos Nacionais</div>
                                    <SelectItem value="nubank" className="rounded-lg">Nubank (Roxo)</SelectItem>
                                    <SelectItem value="itau" className="rounded-lg">Itaú (Laranja)</SelectItem>
                                    <SelectItem value="inter" className="rounded-lg">Inter (Laranja)</SelectItem>
                                    <SelectItem value="santander" className="rounded-lg">Santander (Vermelho)</SelectItem>
                                    <SelectItem value="banco-pan" className="rounded-lg">Banco Pan (Azul)</SelectItem>
                                    <SelectItem value="mercado-pago" className="rounded-lg">Mercado Pago (Azul)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="balance" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Saldo Inicial</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">R$</span>
                            <Input
                                id="balance"
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder="0,00"
                                className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 mt-4">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Configuração de Cartão</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Select value={cardType} onValueChange={setCardType}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium">
                                    <SelectValue placeholder="Possui cartão?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    <SelectItem value="credit">Crédito</SelectItem>
                                    <SelectItem value="debit">Débitos</SelectItem>
                                </SelectContent>
                            </Select>

                            {cardType !== "none" && (
                                <Input
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="4 dígitos finais"
                                    maxLength={4}
                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium"
                                />
                            )}
                        </div>

                        {cardType === "credit" && (
                            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="cardLimit" className="text-[10px] font-bold text-slate-400 uppercase ml-1">Limite de Crédito</Label>
                                <Input
                                    id="cardLimit"
                                    type="number"
                                    value={cardLimit}
                                    onChange={(e) => setCardLimit(e.target.value)}
                                    placeholder="R$ 0,00"
                                    className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium"
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
                        className="w-full md:w-auto h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] order-1 md:order-2"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Alterações"}
                    </Button>

                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            className="w-full md:w-auto h-12 rounded-2xl text-slate-500 font-bold order-2 md:order-1"
                        >
                            Cancelar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
