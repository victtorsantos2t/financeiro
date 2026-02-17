"use client";

import { CreditCard } from "@/components/dashboard/credit-card";
import { Wallet } from "@/components/dashboard/wallet";
import { Button } from "@/components/ui/button";
import { WalletModal } from "@/components/dashboard/add-wallet-modal";
import { Wallet as WalletType } from "@/components/dashboard/wallet-form";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Minhas Carteiras</h1>
                <WalletModal onSuccess={fetchWallets} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Wallet />
                </div>

                <div className="bg-blue-600 dark:bg-blue-800 rounded-3xl p-8 text-white flex flex-col justify-center items-start shadow-lg shadow-blue-200 dark:shadow-none">
                    <h3 className="text-xl font-bold mb-2">Cartão Premium</h3>
                    <p className="text-blue-100 mb-6">Obtenha 5% de cashback em todas as compras.</p>
                    <Button variant="secondary" className="rounded-xl">Saiba Mais</Button>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-6 tracking-tight text-slate-900">Meus Cartões</h2>

                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-8 px-8 pb-10 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="flex-none w-[85%] md:w-[400px] h-56 rounded-3xl bg-slate-100/50 animate-pulse-luxury"></div>
                        ))
                    ) : wallets.length === 0 ? (
                        <div className="flex-1 text-center py-20 text-slate-400 font-semibold italic border-2 border-dashed border-slate-100 rounded-3xl mx-8">
                            Nenhuma carteira configurada.
                        </div>
                    ) : (
                        wallets.map((wallet) => (
                            <div key={wallet.id} className="flex-none w-[85%] md:w-[400px] snap-center">
                                <CreditCard wallet={wallet} onUpdate={fetchWallets} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

