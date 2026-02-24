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
                            className="flex items-center gap-2 rounded-none bg-primary border border-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-[42px] px-6 transition-all shadow-none">
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            <span>Nova Transação</span>
                        </motion.button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden gap-0 bg-card border-2 border-border shadow-none rounded-none animate-in fade-in zoom-in-95 duration-300">
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">{title}</h2>
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
                        className="flex items-center gap-2 rounded-none bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] h-[42px] px-6 border border-primary shadow-none transition-all">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        <span>Nova Transação</span>
                    </motion.button>
                )}
            </DrawerTrigger>

            <DrawerContent
                className="border-t-2 border-border border-l-0 border-r-0 border-b-0 overflow-hidden flex flex-col bg-card rounded-none"
                style={{
                    height: '96vh',
                }}
            >
                <DrawerTitle className="sr-only">{title}</DrawerTitle>

                {/* ── Handle Pill ───────────────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <div className="w-12 h-1.5 rounded-none bg-muted" />
                </div>

                {/* ── Navbar Brutalista ────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
                    {/* Cancelar à esquerda */}
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                        Cancelar
                    </button>

                    {/* Título central */}
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">
                        {title}
                    </span>

                    {/* Espaço vazio à direita para balancear */}
                    <span style={{ width: 64, display: 'block' }} />
                </div>

                {/* ── Conteúdo rolável ──────────────────────────────────────── */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 pb-10 bg-card"
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

// aria-label
