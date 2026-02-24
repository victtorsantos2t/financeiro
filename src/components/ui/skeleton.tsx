import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse-luxury rounded-none bg-muted border-2 border-border/50", className)}
            {...props}
        />
    )
}

export { Skeleton }

// aria-label
