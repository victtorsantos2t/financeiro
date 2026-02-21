"use client";

import { PayableAccounts } from "./payable-accounts";
import { ReceiptsList } from "./receipts-list";
import { PayablesList } from "./payables-list";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar() {
    return (
        <div className="w-full h-full p-2 space-y-6 overflow-y-auto scrollbar-hide">
            <section>
                <PayableAccounts variant="sidebar" />
            </section>

            <section className="bg-card rounded-card p-6 shadow-sm border border-border">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest">Receitas</h3>
                <ReceiptsList variant="sidebar" />
            </section>

            <section className="bg-card rounded-card p-6 shadow-sm border border-border">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest">Pagamentos</h3>
                <PayablesList variant="sidebar" />
            </section>
        </div>
    );
}
