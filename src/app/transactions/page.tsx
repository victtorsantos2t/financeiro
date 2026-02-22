import { TransactionsView } from "@/features/transactions/transactions-view";
import { Suspense } from "react";
import TransactionsLoading from "./loading";

export default function TransactionsPage() {
    return (
        <Suspense fallback={<TransactionsLoading />}>
            <TransactionsView />
        </Suspense>
    );
}
