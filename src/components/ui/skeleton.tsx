import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse-luxury rounded-3xl bg-slate-100/50 backdrop-blur-sm", className)}
            {...props}
        />
    )
}

export { Skeleton }
