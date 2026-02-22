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
            <div className="flex items-center bg-white/80 dark:bg-[#2C2C2E]/80 backdrop-blur-md rounded-full border border-white/20 dark:border-white/5 shadow-sm p-1 transition-all">
                <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "min-w-[130px] px-3 h-8 hover:bg-black/5 dark:hover:bg-white/5 mx-0.5 rounded-full text-foreground transition-all flex items-center justify-center gap-1.5",
                                !currentDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                            <span className="capitalize text-[12px] font-semibold tracking-tight">
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

                <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
