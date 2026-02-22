"use client";

import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Transaction = {
    id: string;
    description: string;
    amount: number;
    category?: { name: string };
};

interface ReceiptsListProps {
    variant?: "card" | "sidebar" | "floating";
}

export function ReceiptsList({ variant = "card" }: ReceiptsListProps) {
    const [receipts, setReceipts] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data } = await supabase
                .from("transactions")
                .select(`
                    id,
                    description,
                    amount,
                    category:categories(name)
                `)
                .eq("user_id", user.id)
                .eq("type", "income")
                .order("date", { ascending: false })
                .limit(3);

            if (data) {
                // @ts-ignore
                setReceipts(data);
            }
        }
        setLoading(false);
    };

    const isFloating = variant === "floating";

    const content = (
        <div className="space-y-4">
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-14 w-full bg-secondary rounded-xl"></div>
                    <div className="h-14 w-full bg-secondary rounded-xl"></div>
                </div>
            ) : receipts.length === 0 ? (
                <p className="text-[10px] font-bold text-muted-foreground text-center py-6 italic uppercase tracking-[0.2em]">Sem recebíveis.</p>
            ) : (
                receipts.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group cursor-pointer active:scale-[0.98] transition-all">
                        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center border border-border shrink-0">
                            <ArrowUpRight className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-[14px] text-foreground leading-tight mb-0.5 truncate">
                                R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[11px] font-medium text-muted-foreground truncate">{item.description}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    if (variant === "sidebar" || variant === "floating") {
        return content;
    }

    return (
        <div className="w-full bg-card rounded-card p-6 shadow-sm border border-border transition-all duration-300">
            <h3 className="text-lg font-bold text-foreground mb-6 tracking-tight">Últimas Receitas</h3>
            {content}
        </div>
    );
}

