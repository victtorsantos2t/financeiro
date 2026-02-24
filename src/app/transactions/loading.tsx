import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="max-w-5xl mx-auto w-full px-6 py-4">
                <div className="flex items-center justify-between h-14 mb-8">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </div>
                <div className="flex gap-4 border-b border-border mb-6">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-6 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// aria-label
