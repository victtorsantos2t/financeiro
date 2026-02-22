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
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Wallet, WalletForm } from "./wallet-form";
import { useMediaQuery } from "@/hooks/use-media-query";

interface WalletModalProps {
    wallet?: Wallet;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function WalletModal({ wallet, trigger, onSuccess }: WalletModalProps) {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handleOpen = () => setOpen(true);
        window.addEventListener('open-wallet-modal', handleOpen);
        return () => window.removeEventListener('open-wallet-modal', handleOpen);
    }, []);

    const handleSuccess = () => {
        setOpen(false);
        if (onSuccess) onSuccess();
    };

    if (!isMounted) return null;

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button className="gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="h-5 w-5" />
                            Adicionar Nova Carteira
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px] rounded-[32px] border-slate-100 shadow-2xl p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-250 ease-in-out bg-transparent border-0">
                    <DialogTitle className="sr-only">
                        {wallet ? "Editar Carteira" : "Nova Carteira"}
                    </DialogTitle>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-[32px] overflow-hidden">
                        <WalletForm wallet={wallet} onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger || (
                    <Button className="gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="h-5 w-5" />
                        Adicionar Nova Carteira
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="rounded-t-[32px] max-h-[96vh] p-0 border-0 bg-transparent">
                <DrawerTitle className="sr-only">
                    {wallet ? "Editar Carteira" : "Nova Carteira"}
                </DrawerTitle>
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/50 mt-4 mb-4 absolute top-0 left-1/2 -translate-x-1/2 z-50 mix-blend-overlay" />
                <div className="overflow-y-auto w-full bg-white dark:bg-[#1C1C1E] rounded-t-[32px] overflow-hidden">
                    <WalletForm wallet={wallet} onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}


