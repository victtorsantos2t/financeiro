"use client";

import { PayableAccounts } from "./payable-accounts";
import { ReceiptsList } from "./receipts-list";
import { PayablesList } from "./payables-list";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar() {
    return (
        <div className="w-full h-full p-4 space-y-8 overflow-y-auto custom-scrollbar">
            <section>
                <PayableAccounts variant="sidebar" />
            </section>

            <section>
                <h3 className="text-base font-bold text-slate-900 mb-4 tracking-tight">Receitas</h3>
                <ReceiptsList variant="sidebar" />
            </section>

            <section>
                <h3 className="text-base font-bold text-slate-900 mb-4 tracking-tight">Pagamentos</h3>
                <PayablesList variant="sidebar" />
            </section>
        </div>
    );
}
