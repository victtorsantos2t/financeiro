"use client";

import { CreditCard } from "@/components/dashboard/credit-card";
import { Wallet } from "@/components/dashboard/wallet";
import { Button } from "@/components/ui/button";
import { WalletModal } from "@/components/dashboard/add-wallet-modal";
import { Wallet as WalletType } from "@/components/dashboard/wallet-form";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IOSPageHeader } from "@/components/layout/ios-page-header";

export default function WalletPage() {
    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from("wallets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            setWallets(data || []);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 pb-12">
            <IOSPageHeader
                title="Carteiras"
                subtitle="Contas e métodos de pagamento"
                action={<WalletModal onSuccess={fetchWallets} />}
            />
            <div className="hidden md:flex justify-between items-center bg-card p-6 rounded-card border border-border shadow-sm">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Minhas Carteiras</h1>
                    <p className="text-sm text-muted-foreground font-medium">Gerencie suas contas bancárias e métodos de pagamento.</p>
                </div>
                <WalletModal onSuccess={fetchWallets} />
            </div>

            <div className="w-full">
                <Wallet />
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-8 bg-primary rounded-full" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Meus Cartões</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="w-full h-52 rounded-card bg-secondary/30 animate-pulse-luxury border border-border/50"></div>
                        ))
                    ) : wallets.length === 0 ? (
                        <div className="col-span-full text-center py-24 text-muted-foreground font-bold italic border-2 border-dashed border-border/50 rounded-card bg-card">
                            Nenhuma carteira configurada.
                        </div>
                    ) : (
                        wallets.map((wallet) => (
                            <div key={wallet.id} className="w-full transition-transform hover:scale-[1.02]">
                                <CreditCard wallet={wallet} onUpdate={fetchWallets} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

