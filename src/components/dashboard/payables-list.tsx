"use client";

import { createClient } from "@/lib/supabase/client";
import { FileText, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface PayablesListProps {
    variant?: "card" | "sidebar" | "floating";
}

type Payable = {
    id: string;
    description: string;
    amount: number;
};

export function PayablesList({ variant = "card" }: PayablesListProps) {
    const [payables, setPayables] = useState<Payable[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchPayables = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("transactions")
                    .select("id, description, amount")
                    .eq("user_id", user.id)
                    .eq("type", "expense")
                    .eq("status", "pending")
                    .order("date", { ascending: true })
                    .limit(3);

                if (data) setPayables(data as any);
            }
            setLoading(false);
        };

        fetchPayables();

        // Realtime subscription
        const channel = supabase
            .channel('realtime_payables')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                },
                () => {
                    fetchPayables();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const isFloating = variant === "floating";

    const content = (
        <div className="space-y-6">
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-16 w-full bg-slate-50/50 rounded-2xl"></div>
                        <div className="h-16 w-full bg-slate-50/50 rounded-2xl"></div>
                    </div>
                ) : payables.length === 0 ? (
                    <p className="text-[10px] font-semibold text-slate-300 text-center py-6 italic uppercase tracking-[0.2em]">Sem pendências.</p>
                ) : (
                    payables.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 group cursor-pointer active:scale-[0.98] transition-all">
                            <div className="w-10 h-10 rounded-[14px] bg-white flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] border border-slate-100/50 shrink-0">
                                <FileText className="h-4 w-4 text-slate-900/40 group-hover:text-blue-500 transition-colors" />
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
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Pendentes</h3>
                <Link href="/payables" className="text-[10px] font-semibold text-blue-500/80 hover:text-blue-600 uppercase tracking-widest transition-colors">
                    Ver Tudo
                </Link>
            </div>
            {content}
        </div>
    );
}

