"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WalletModal } from "@/features/wallets/add-wallet-modal";
import { Wallet } from "lucide-react";

export function OnboardingWizard() {
    const [open, setOpen] = useState(false);
    const [hasWallet, setHasWallet] = useState<boolean | null>(null);
    const supabase = createClient();

    useEffect(() => {
        checkWallets();
    }, []);

    const checkWallets = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count } = await supabase
            .from("wallets")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", user.id);

        if (count === 0) {
            setHasWallet(false);
            setOpen(true);
        } else {
            setHasWallet(true);
        }
    };

    if (hasWallet === null || hasWallet === true) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary" />
                        Bem-vindo ao Sistema!
                    </DialogTitle>
                    <DialogDescription>
                        Para começar a gerenciar suas finanças, o primeiro passo é criar sua primeira carteira.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                        Uma carteira pode ser sua conta bancária, dinheiro físico, ou até mesmo uma reserva de emergência.
                    </p>
                    <div className="flex justify-center">
                        <WalletModal />
                    </div>
                </div>

                <DialogFooter>
                    <p className="text-xs text-muted-foreground w-full text-center">
                        Você poderá adicionar mais carteiras depois.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// aria-label
