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
                <div className="space-y-4 animate-pulse pt-2">
                    <div className="h-[42px] w-full bg-muted rounded-none"></div>
                    <div className="h-[42px] w-full bg-muted rounded-none"></div>
                </div>
            ) : receipts.length === 0 ? (
                <p className="text-[10px] font-bold text-muted-foreground text-center py-6 italic uppercase tracking-[0.2em]">Sem recebíveis.</p>
            ) : (
                receipts.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group cursor-pointer active:scale-[0.98] transition-all">
                        <div className="w-[42px] h-[42px] rounded-none bg-background border-2 border-border flex items-center justify-center shrink-0 text-muted-foreground group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors">
                            <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-black text-[12px] uppercase tracking-widest text-foreground leading-tight mb-0.5 truncate">
                                R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{item.description}</p>
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
        <div className="w-full bg-card p-6 border-2 border-border transition-all duration-300 rounded-none shadow-none">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6 border-b border-border pb-4">Últimas Receitas</h3>
            {content}
        </div>
    );
}


// aria-label
