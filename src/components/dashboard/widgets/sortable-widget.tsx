"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export function SortableWidget({ id, children, className }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("touch-none", className)}>
            <div {...attributes} {...listeners} className="h-full">
                {children}
            </div>
        </div>
    );
}
