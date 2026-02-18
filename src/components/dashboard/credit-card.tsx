"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { CreditCard as CreditCardIcon, Landmark, Wallet as WalletIcon, Pencil, Trash2 } from "lucide-react";
import { WalletModal } from "./add-wallet-modal";
import { Wallet } from "./wallet-form";
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
import { Button } from "@/components/ui/button";
import { generateCardGradient, getContrastColor } from "@/lib/theme-utils";

interface CreditCardProps {
    wallet: Wallet;
    onUpdate?: () => void;
}

export function CreditCard({ wallet, onUpdate }: CreditCardProps) {
    const supabase = createClient();

    const handleDelete = async () => {
        const { error } = await supabase
            .from("wallets")
            .delete()
            .eq("id", wallet.id);

        if (error) {
            toast.error("Erro ao excluir carteira", { description: error.message });
        } else {
            toast.success("Carteira excluída com sucesso");
            if (onUpdate) onUpdate();
        }
    };

    const CardIcon = wallet.card_type === 'credit' ? CreditCardIcon : Landmark;

    // Masking card number but showing suffix
    const displayNum = wallet.card_number
        ? `**** **** **** ${wallet.card_number}`
        : wallet.type ? wallet.type.toUpperCase() : "CONTA Padrão";

    const currentGradient = generateCardGradient(wallet.color);
    const textColor = getContrastColor(wallet.color);
    const textSecondary = textColor === 'white' ? 'text-white/70' : 'text-slate-500';
    const iconColor = textColor === 'white' ? 'text-white/40 group-hover:text-white/60' : 'text-slate-400 group-hover:text-slate-600';

    // Yield Calculation Logic
    const getEstimatedYield = () => {
        if (wallet.type !== 'Investimento' || !wallet.yield_percentage) return null;

        const CDI_ANNUAL = 0.1125; // 11.25%
        const SELIC_ANNUAL = 0.1125;
        const IPCA_ANNUAL = 0.045; // 4.5% Project

        let annualRate = 0;

        // @ts-ignore
        const benchmark = wallet.yield_benchmark || "CDI";
        // @ts-ignore
        const percentage = (wallet.yield_percentage || 100) / 100;

        switch (benchmark) {
            case 'CDI': annualRate = CDI_ANNUAL * percentage; break;
            case 'SELIC': annualRate = SELIC_ANNUAL * percentage; break;
            case 'IPCA': annualRate = IPCA_ANNUAL + (percentage / 100); break; // Usually IPCA + X%
            case 'FIXED': annualRate = percentage; break;
            default: annualRate = 0.10; // Default 10%
        }

        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const monthlyAmount = wallet.balance * monthlyRate;

        return monthlyAmount;
    };

    const monthlyYield = getEstimatedYield();

    return (
        <div
            className="relative group w-full h-56 rounded-3xl p-8 flex flex-col justify-between overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 select-none"
            style={{ background: currentGradient }}
        >
            {/* Investment Badge */}
            {wallet.investment_type && wallet.yield_percentage && (
                <div className="absolute top-0 right-14 bg-white/20 backdrop-blur-md px-3 py-1 rounded-bl-xl rounded-tr-xl border-l border-b border-white/10 shadow-lg z-20">
                    <p className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        {wallet.yield_percentage}% do {wallet.yield_benchmark}
                        <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                    </p>
                </div>
            )}

            {/* Mesh gradient effect shadows */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
            <div className="absolute left-10 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4">
                    <div className="font-mono text-xl tracking-[0.25em] mb-4 drop-shadow-sm opacity-90" style={{ color: textColor }}>
                        {displayNum}
                    </div>

                    <div>
                        <p className="font-semibold text-xl mb-0.5 tracking-tight leading-tight" style={{ color: textColor }}>{wallet.name}</p>
                        <p className={`text-[10px] font-semibold uppercase tracking-[0.15em] opacity-70 ${textColor === 'white' ? 'text-white' : 'text-slate-500'}`}>
                            {wallet.card_type === 'credit' ? 'Crédito' : wallet.card_type === 'debit' ? 'Débito' : wallet.type}
                        </p>
                    </div>

                    <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-[0.15em] opacity-70 mb-0.5 ${textColor === 'white' ? 'text-white' : 'text-slate-500'}`}>
                            {wallet.card_type === 'credit' ? 'Fatura Atual' : 'Saldo Atual'}
                        </p>
                        <p className="font-mono text-lg font-medium tracking-tight" style={{ color: textColor }}>
                            {wallet.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        {monthlyYield && (
                            <div className="flex flex-col mt-3 space-y-0.5">
                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60" style={{ color: textColor }}>Rendimento Estimado</p>
                                <div className="flex flex-col">
                                    <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: textColor === 'white' ? '#4ade80' : '#16a34a' }}>
                                        + {(monthlyYield / 30).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-[9px] opacity-80 font-normal text-white">/ dia</span>
                                    </p>
                                    <p className="text-[10px] font-medium flex items-center gap-1 opacity-80" style={{ color: textColor }}>
                                        + {monthlyYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-[9px] opacity-80 font-normal">/ mês</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex -space-x-3 mb-4 opacity-80">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10"></div>
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 -translate-x-1"></div>
                    </div>

                    <CardIcon className={`h-6 w-6 transition-all duration-300 ${iconColor}`} strokeWidth={1.5} />
                </div>
            </div>

            {/* Actions overlay */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-50">
                <WalletModal
                    wallet={wallet}
                    onSuccess={onUpdate}
                    trigger={
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border-none shadow-sm transition-transform active:scale-95"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    }
                />

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md text-red-500 border-none shadow-sm transition-transform active:scale-95"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-semibold">Excluir Carteira</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                                Tem certeza que deseja excluir "{wallet.name}"? Esta ação é irreversível.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                            <AlertDialogCancel className="rounded-2xl border-slate-100 hover:bg-slate-50">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600 rounded-2xl border-none">
                                Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {/* Subtle decorative pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none mix-blend-overlay">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
        </div>
    );
}

