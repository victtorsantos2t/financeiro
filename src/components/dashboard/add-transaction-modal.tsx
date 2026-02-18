"use client";

import { Button } from "@/components/ui/button";
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
import { TransactionForm, Transaction } from "@/components/dashboard/transaction-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface TransactionModalProps {
    children?: React.ReactNode;
    transaction?: Transaction;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

import { motion } from "framer-motion";

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

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent hydration mismatch
    if (!isMounted) {
        return null;
    }

    const title = transaction ? "Editar Transação" : "Nova Transação";

    if (isDesktop) {
        return (
            <Dialog open={finalOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    {children || (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-semibold h-11 px-6 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] transition-all"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            <span className="text-[13px] tracking-tight">Nova Transação</span>
                        </motion.button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden gap-0 bg-white border-none shadow-[0_32px_80px_-20px_rgba(0,0,0,0.15)] rounded-[32px] animate-in fade-in zoom-in-95 duration-300">
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <div className="p-10 bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
                                <p className="text-[12px] text-slate-400 font-medium">Registro financeiro de precisão</p>
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

    return (
        <Drawer open={finalOpen} onOpenChange={handleOpenChange} shouldScaleBackground>
            <DrawerTrigger asChild>
                {children || (
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-semibold h-11 px-6 shadow-lg shadow-slate-200 transition-all"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        <span className="text-[13px] tracking-tight">Nova Transação</span>
                    </motion.button>
                )}
            </DrawerTrigger>
            <DrawerContent className="h-[96vh] rounded-t-[40px] border-none bg-white shadow-2xl overflow-hidden flex flex-col">
                <DrawerTitle className="sr-only">{title}</DrawerTitle>

                {/* Visual Handle */}
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-100 mt-4 mb-4" />

                <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar mt-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h2>
                            <p className="text-[14px] text-slate-500 font-medium tracking-tight">Registro financeiro de precisão</p>
                        </div>
                    </div>

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

