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
        <div className="space-y-6">
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-16 w-full bg-slate-50/50 rounded-2xl"></div>
                        <div className="h-16 w-full bg-slate-50/50 rounded-2xl"></div>
                    </div>
                ) : receipts.length === 0 ? (
                    <p className="text-[10px] font-semibold text-slate-300 text-center py-6 italic uppercase tracking-[0.2em]">Sem recebíveis.</p>
                ) : (
                    receipts.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 group cursor-pointer active:scale-[0.98] transition-all">
                            <div className="w-10 h-10 rounded-[14px] bg-white flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] border border-slate-100/50 shrink-0">
                                <ArrowUpRight className="h-4 w-4 text-slate-900/40 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div>
                                <p className="font-semibold text-[15px] text-slate-900 leading-tight mb-1">
                                    R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[11px] font-semibold text-slate-400/80 tracking-wide">{item.description}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    if (variant === "sidebar" || variant === "floating") {
        return content;
    }

    return (
        <div className="w-full bg-white rounded-[24px] p-8 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.02)] border border-slate-100/40 transition-all duration-500">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 tracking-tight">Últimas Receitas</h3>
            {content}
        </div>
    );
}

