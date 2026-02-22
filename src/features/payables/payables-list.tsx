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
        <div className="space-y-4">
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-14 w-full bg-secondary rounded-xl"></div>
                    <div className="h-14 w-full bg-secondary rounded-xl"></div>
                </div>
            ) : payables.length === 0 ? (
                <p className="text-[10px] font-bold text-muted-foreground text-center py-6 italic uppercase tracking-[0.2em]">Sem pendências.</p>
            ) : (
                payables.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group cursor-pointer active:scale-[0.98] transition-all">
                        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center border border-border shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Pendentes</h3>
                <Link href="/payables" className="text-[10px] font-bold text-primary hover:text-primary-hover uppercase tracking-widest transition-colors">
                    Ver Tudo
                </Link>
            </div>
            {content}
        </div>
    );
}

