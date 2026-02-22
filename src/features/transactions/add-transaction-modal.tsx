"use client";

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { TransactionForm, Transaction } from "./transaction-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TransactionModalProps {
    children?: React.ReactNode;
    transaction?: Transaction;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const iOSFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";

export function AddTransactionModal({ children, transaction, open, onOpenChange }: TransactionModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [isMounted, setIsMounted] = useState(false);

    const isControlled = open !== undefined;
    const finalOpen = isControlled ? open : internalOpen;
    const finalSetOpen = isControlled ? onOpenChange : setInternalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (finalSetOpen) finalSetOpen(newOpen);
    };

    useEffect(() => { setIsMounted(true); }, []);
    if (!isMounted) return null;

    const title = transaction ? "Editar Transação" : "Nova Transação";

    // ── Desktop ───────────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <Dialog open={finalOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    {children || (
                        <motion.button whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-semibold h-11 px-6 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] transition-all">
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            <span className="text-[13px] tracking-tight">Nova Transação</span>
                        </motion.button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden gap-0 bg-card border border-border shadow-[0_32px_80px_-20px_rgba(0,0,0,0.15)] rounded-[32px] animate-in fade-in zoom-in-95 duration-300">
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <div className="p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground tracking-tight">{title}</h2>
                                <p className="text-[12px] text-muted-foreground font-medium">Registro financeiro de precisão</p>
                            </div>
                        </div>
                        <TransactionForm
                            transaction={transaction}
                            onSuccess={() => handleOpenChange(false)}
                            onCancel={() => handleOpenChange(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── Mobile: iOS Sheet nativo ───────────────────────────────────────────────
    return (
        <Drawer open={finalOpen} onOpenChange={handleOpenChange} shouldScaleBackground>
            <DrawerTrigger asChild>
                {children || (
                    <motion.button whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 rounded-2xl bg-foreground text-background font-semibold h-11 px-6 shadow-lg transition-all">
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        <span className="text-[13px] tracking-tight">Nova Transação</span>
                    </motion.button>
                )}
            </DrawerTrigger>

            <DrawerContent
                className="border-none overflow-hidden flex flex-col bg-[#F2F2F7] dark:bg-[#1C1C1E]"
                style={{
                    height: '96vh',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                }}
            >
                <DrawerTitle className="sr-only">{title}</DrawerTitle>

                {/* ── Handle Pill ───────────────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <div className="w-9 h-1.5 rounded-full bg-muted/20" />
                </div>

                {/* ── iOS Navigation Bar ────────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                    {/* Cancelar à esquerda */}
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: 17, color: '#007AFF', fontFamily: iOSFont, fontWeight: 400,
                            padding: '4px 0',
                        }}
                    >
                        Cancelar
                    </button>

                    {/* Título central */}
                    <span style={{
                        fontSize: 17, fontWeight: 600, color: 'var(--foreground)', fontFamily: iOSFont, letterSpacing: '-0.3px',
                    }}>
                        {title}
                    </span>

                    {/* Espaço vazio à direita para balancear */}
                    <span style={{ width: 64, display: 'block' }} />
                </div>

                {/* ── Conteúdo rolável ──────────────────────────────────────── */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 pb-10 bg-[#F2F2F7] dark:bg-[#1C1C1E]"
                >
                    <TransactionForm
                        transaction={transaction}
                        onSuccess={() => handleOpenChange(false)}
                        onCancel={() => handleOpenChange(false)}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
