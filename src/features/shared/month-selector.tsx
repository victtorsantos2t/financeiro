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
            <div className="flex items-center bg-card rounded-none border-2 border-border shadow-none p-0.5 transition-all">
                <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-[30px] w-[30px] rounded-none hover:bg-secondary border border-transparent hover:border-border text-muted-foreground transition-all">
                    <ChevronLeft className="h-4 w-4 stroke-[3]" />
                </Button>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "min-w-[120px] px-2 h-[30px] hover:bg-secondary mx-0.5 rounded-none border border-transparent hover:border-border text-foreground transition-all flex items-center justify-center gap-1.5",
                                !currentDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="h-3.5 w-3.5 text-foreground stroke-[2.5]" />
                            <span className="uppercase text-[10px] font-black tracking-widest mt-0.5">
                                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-2 border-border shadow-none rounded-none bg-card overflow-hidden" align="center">
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

                <Button variant="ghost" size="icon" onClick={handleNext} className="h-[30px] w-[30px] rounded-none hover:bg-secondary border border-transparent hover:border-border text-muted-foreground transition-all">
                    <ChevronRight className="h-4 w-4 stroke-[3]" />
                </Button>
            </div>
        </div>
    );
}

// aria-label
