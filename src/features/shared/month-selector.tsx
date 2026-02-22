"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
    currentDate: Date;
    onMonthChange: (date: Date) => void;
}

export function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
    const [open, setOpen] = useState(false);

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMonthChange(subMonths(currentDate, 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMonthChange(addMonths(currentDate, 1));
    };

    return (
        <div className="flex items-center justify-center w-full px-4">
            <div className="flex items-center bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl rounded-full border border-black/[0.03] dark:border-white/[0.03] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-0.5 transition-all">
                <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-all">
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "min-w-[120px] px-2 h-7 hover:bg-black/5 dark:hover:bg-white/5 mx-0.5 rounded-full text-foreground transition-all flex items-center justify-center gap-1.5",
                                !currentDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="h-3 w-3 text-blue-500" />
                            <span className="capitalize text-[11px] font-medium tracking-tight">
                                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-[24px] overflow-hidden" align="center">
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={(date) => {
                                if (date) {
                                    onMonthChange(date);
                                    setOpen(false);
                                }
                            }}
                            initialFocus
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" onClick={handleNext} className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-all">
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
