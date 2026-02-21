"use client";

import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

import { PayablesModal } from "./payables-modal";

interface PayableAccountsProps {
    variant?: "card" | "sidebar";
}

export function PayableAccounts({ variant = "card" }: PayableAccountsProps) {
    const [pendingCount, setPendingCount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchPayables();
    }, []);

    const fetchPayables = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

            const { data } = await supabase
                .from("transactions")
                .select("amount")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .neq("status", "completed") // Only pending
                .gte("date", start)
                .lte("date", end);

            if (data) {
                setPendingCount(data.length);
                const total = data.reduce((acc, curr) => acc + curr.amount, 0);
                setTotalAmount(total);
            }
        }
        setLoading(false);
    };

    const content = (
        <>
            <div
                onClick={() => setOpen(true)}
                className={`${variant === "sidebar" ? "bg-card rounded-card p-6 shadow-sm border border-border cursor-pointer hover:bg-secondary/50 transition-all group" : ""}`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight group-hover:text-primary transition-colors">Contas a Pagar</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        Ciclo Atual
                    </p>
                </div>

                <div>
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-3xl text-foreground tracking-tight">
                            {loading ? "..." : `R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {loading ? "..." : `${pendingCount} pendentes`}
                        </span>
                    </div>
                </div>
            </div>

            <PayablesModal
                open={open}
                onOpenChange={setOpen}
                onUpdate={fetchPayables}
            />
        </>
    );

    if (variant === "sidebar") {
        return content;
    }

    return (
        <div className="w-full bg-card rounded-card p-6 flex flex-col justify-between shadow-sm border border-border transition-all duration-300">
            {content}
        </div>
    );
}

