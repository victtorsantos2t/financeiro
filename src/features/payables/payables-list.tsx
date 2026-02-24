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
                <div className="space-y-4 animate-pulse pt-2">
                    <div className="h-[42px] w-full bg-muted rounded-none"></div>
                    <div className="h-[42px] w-full bg-muted rounded-none"></div>
                </div>
            ) : payables.length === 0 ? (
                <p className="text-[10px] font-bold text-muted-foreground text-center py-6 italic uppercase tracking-[0.2em]">Sem pendências.</p>
            ) : (
                payables.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group cursor-pointer active:scale-[0.98] transition-all">
                        <div className="w-[42px] h-[42px] rounded-none bg-background flex items-center justify-center border-2 border-border shrink-0 text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                            <FileText className="h-5 w-5 stroke-[2.5]" />
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
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Pendentes</h3>
                <Link href="/payables" className="text-[10px] font-black hover:text-foreground text-muted-foreground uppercase tracking-widest border border-transparent hover:border-border transition-all px-2 py-1">
                    Ver Tudo
                </Link>
            </div>
            {content}
        </div>
    );
}


// aria-label
