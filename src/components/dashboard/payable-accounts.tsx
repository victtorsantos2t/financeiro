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
                className={`${variant === "sidebar" ? "bg-white rounded-[24px] p-8 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.02)] border border-slate-100/40 cursor-pointer hover:bg-slate-50/50 transition-all group" : ""}`}
            >
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 tracking-tight group-hover:text-blue-600 transition-colors">Contas a Pagar</h3>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        Ciclo Atual
                    </p>
                </div>

                <div>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-3xl text-slate-900 tracking-[-0.02em]">
                            {loading ? "..." : `R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {loading ? "..." : `${pendingCount} lançamentos pendentes`}
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
        <div className="w-full bg-white rounded-[24px] p-8 flex flex-col justify-between shadow-[0_2px_12px_-2px_rgba(0,0,0,0.02)] border border-slate-100/40 transition-all duration-500">
            {content}
        </div>
    );
}

