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
    const textSecondary = textColor === 'white' ? 'text-white/70' : 'text-muted-foreground';
    const iconColor = textColor === 'white' ? 'text-white/40 group-hover:text-white/60' : 'text-muted-foreground group-hover:text-foreground';

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
            className="relative group w-full h-64 rounded-[20px] p-6 flex flex-col justify-between overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-white/20 select-none"
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

            <div className="flex flex-col h-full relative z-10">
                {/* Top Section: Number & Logo */}
                <div className="flex justify-between items-start mb-auto">
                    <div className="font-mono text-lg tracking-[0.25em] drop-shadow-sm opacity-90" style={{ color: textColor }}>
                        {displayNum}
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex -space-x-3 mb-3 opacity-80">
                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10"></div>
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 -translate-x-1"></div>
                        </div>
                        <CardIcon className={`h-6 w-6 transition-all duration-300 ${iconColor}`} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Middle Section: Name & Type */}
                <div className="mb-4">
                    <p className="font-semibold text-xl mb-0.5 tracking-tight leading-tight" style={{ color: textColor }}>{wallet.name}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.15em] opacity-80 ${textColor === 'white' ? 'text-white' : 'text-muted-foreground'}`}>
                        {wallet.card_type === 'credit' ? 'Crédito' : wallet.card_type === 'debit' ? 'Débito' : wallet.type}
                    </p>
                </div>

                {/* Bottom Section: Balance & Actions (Full Width) */}
                <div className="w-full">
                    <div className="flex items-end justify-between w-full">
                        <div className="flex-1">
                            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] opacity-80 mb-0.5 ${textColor === 'white' ? 'text-white' : 'text-muted-foreground'}`}>
                                {wallet.card_type === 'credit' ? 'Fatura Atual' : 'Saldo Atual'}
                            </p>
                            <p className="font-mono text-lg font-medium tracking-tight" style={{ color: textColor }}>
                                {wallet.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>

                        {/* Actions — Garantindo alinhamento total à direita */}
                        <div className="flex gap-2 z-10 ml-4">
                            <WalletModal
                                wallet={wallet}
                                onSuccess={onUpdate}
                                trigger={
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className={`h-9 w-9 rounded-xl ${textColor === 'white' ? 'bg-white/20 hover:bg-white/40' : 'bg-black/5 hover:bg-black/10'} backdrop-blur-md border-none shadow-sm transition-transform active:scale-95`}
                                    >
                                        <Pencil className={`h-4 w-4 ${textColor === 'white' ? 'text-white' : 'text-foreground'}`} />
                                    </Button>
                                }
                            />

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className={`h-9 w-9 rounded-xl ${textColor === 'white' ? 'bg-red-500/20 hover:bg-red-500/40 text-red-100' : 'bg-red-500/10 hover:bg-red-500/20 text-red-600'} backdrop-blur-md border-none shadow-sm transition-transform active:scale-95`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[20px] border-none shadow-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold tracking-tight">Excluir Carteira</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground">
                                            Tem certeza que deseja excluir "{wallet.name}"? Esta ação é irreversível.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2 sm:gap-0">
                                        <AlertDialogCancel className="rounded-2xl border-border hover:bg-secondary">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive-hover rounded-2xl border-none font-bold">
                                            Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {monthlyYield && (
                        <div className="flex flex-col mt-3 space-y-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-60" style={{ color: textColor }}>Rendimento Estimado</p>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: textColor === 'white' ? '#4ade80' : '#16a34a' }}>
                                        + {(monthlyYield / 30).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        <span className={`text-[9px] font-medium ${textColor === 'white' ? 'opacity-70 text-white' : 'opacity-60 text-foreground'}`}>/ dia</span>
                                    </p>
                                </div>
                                <div className={`h-3 w-px ${textColor === 'white' ? 'bg-white/20' : 'bg-black/10'}`}></div>
                                <div className="flex flex-col">
                                    <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: textColor === 'white' ? '#4ade80' : '#16a34a' }}>
                                        + {monthlyYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        <span className={`text-[9px] font-medium ${textColor === 'white' ? 'opacity-70 text-white' : 'opacity-60 text-foreground'}`}>/ mês</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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

