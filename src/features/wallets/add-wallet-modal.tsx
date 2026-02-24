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
                        <Button className="gap-2 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-[42px] px-6 shadow-none border border-primary transition-all">
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            <span>Nova Carteira</span>
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px] rounded-none border-2 border-border shadow-none p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-250 ease-in-out bg-card">
                    <DialogTitle className="sr-only">
                        {wallet ? "Editar Carteira" : "Nova Carteira"}
                    </DialogTitle>
                    <div className="bg-card w-full h-full">
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
                    <Button className="gap-2 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-[42px] px-6 shadow-none border border-primary transition-all">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        <span>Nova Carteira</span>
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="rounded-none max-h-[96vh] p-0 border-t-2 border-border border-b-0 border-l-0 border-r-0 bg-card">
                <DrawerTitle className="sr-only">
                    {wallet ? "Editar Carteira" : "Nova Carteira"}
                </DrawerTitle>
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 bg-muted mt-4 mb-4" />
                <div className="overflow-y-auto w-full bg-card">
                    <WalletForm wallet={wallet} onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}



// aria-label
