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
            className="relative group w-full h-64 rounded-none border-2 p-6 flex flex-col justify-between overflow-hidden shadow-none transition-all duration-300 border-border select-none"
            style={{ background: currentGradient }}
        >
            {/* Investment Badge */}
            {wallet.investment_type && wallet.yield_percentage && (
                <div className="absolute top-0 right-14 bg-white/20 backdrop-blur-md px-3 py-1 rounded-none border-l-2 border-b-2 border-white/10 shadow-none z-20">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                        {wallet.yield_percentage}% do {wallet.yield_benchmark}
                        <span className="flex h-1.5 w-1.5 relative bg-emerald-500 rounded-none border border-emerald-400">
                        </span>
                    </p>
                </div>
            )}

            {/* Mesh gradient effect shadows */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-none blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
            <div className="absolute left-10 bottom-0 w-32 h-32 bg-white/10 rounded-none blur-2xl"></div>

            <div className="flex flex-col h-full relative z-10">
                {/* Top Section: Number & Logo */}
                <div className="flex justify-between items-start mb-auto">
                    <div className="font-mono text-sm tracking-widest drop-shadow-sm opacity-90 font-black uppercase" style={{ color: textColor }}>
                        {displayNum}
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex -space-x-1 mb-3 opacity-80">
                            <div className="w-10 h-10 rounded-none bg-white/10 backdrop-blur-md border-2 border-white/10"></div>
                            <div className="w-10 h-10 rounded-none bg-white/20 backdrop-blur-md border-2 border-white/20 -translate-x-3"></div>
                        </div>
                        <CardIcon className={`h-6 w-6 transition-all duration-300 ${iconColor}`} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Middle Section: Name & Type */}
                <div className="mb-4">
                    <p className="font-black text-[16px] uppercase tracking-widest mb-0.5 leading-tight" style={{ color: textColor }}>{wallet.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${textColor === 'white' ? 'text-white' : 'text-muted-foreground'}`}>
                        {wallet.card_type === 'credit' ? 'Crédito' : wallet.card_type === 'debit' ? 'Débito' : wallet.type}
                    </p>
                </div>

                {/* Bottom Section: Balance & Actions (Full Width) */}
                <div className="w-full">
                    <div className="flex items-end justify-between w-full">
                        <div className="flex-1">
                            <p className={`text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5 ${textColor === 'white' ? 'text-white' : 'text-muted-foreground'}`}>
                                {wallet.card_type === 'credit' ? 'Fatura Atual' : 'Saldo Atual'}
                            </p>
                            <p className="font-mono text-xl font-black tracking-widest uppercase" style={{ color: textColor }}>
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
                                        className={`h-9 w-9 rounded-none ${textColor === 'white' ? 'bg-white/20 hover:bg-white/40' : 'bg-black/5 hover:bg-black/10'} backdrop-blur-md border border-white/20 shadow-none transition-transform active:scale-95`}
                                    >
                                        <Pencil className={`h-4 w-4 stroke-[2.5] ${textColor === 'white' ? 'text-white' : 'text-foreground'}`} />
                                    </Button>
                                }
                            />

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className={`h-9 w-9 rounded-none ${textColor === 'white' ? 'bg-red-500/20 hover:bg-red-500/40 text-red-100' : 'bg-red-500/10 hover:bg-red-500/20 text-red-600'} backdrop-blur-md border border-red-500/30 shadow-none transition-transform active:scale-95`}
                                    >
                                        <Trash2 className="h-4 w-4 stroke-[3]" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-none border-2 border-border shadow-none bg-card">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-[12px] font-black uppercase tracking-widest text-foreground">Excluir Carteira</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
                                            Tem certeza que deseja excluir "{wallet.name}"? Esta ação é irreversível.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2 sm:gap-0 mt-6">
                                        <AlertDialogCancel className="rounded-none border-2 border-border font-black text-foreground hover:bg-secondary h-[42px] uppercase tracking-widest text-[10px]">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="rounded-none bg-destructive hover:bg-destructive/90 font-black text-destructive-foreground h-[42px] px-6 uppercase tracking-widest text-[10px] border border-destructive shadow-none">
                                            Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {monthlyYield && (
                        <div className="flex flex-col mt-3 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: textColor }}>Rendimento Estimado</p>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black flex items-center gap-1 uppercase tracking-widest" style={{ color: textColor === 'white' ? '#4ade80' : '#16a34a' }}>
                                        + {(monthlyYield / 30).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        <span className={`text-[8px] font-bold tracking-widest ${textColor === 'white' ? 'opacity-70 text-white' : 'opacity-60 text-foreground'}`}>/ dia</span>
                                    </p>
                                </div>
                                <div className={`h-3 w-px ${textColor === 'white' ? 'bg-white/20' : 'bg-black/10'}`}></div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black flex items-center gap-1 uppercase tracking-widest" style={{ color: textColor === 'white' ? '#4ade80' : '#16a34a' }}>
                                        + {monthlyYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        <span className={`text-[8px] font-bold tracking-widest ${textColor === 'white' ? 'opacity-70 text-white' : 'opacity-60 text-foreground'}`}>/ mês</span>
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


// aria-label
