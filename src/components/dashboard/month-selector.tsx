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
        <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/50 backdrop-blur-md rounded-[16px] border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.02)] p-1.5 transition-all">
                <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8 rounded-[12px] hover:bg-white text-slate-300 hover:text-slate-900 transition-all">
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-[160px] justify-start text-left font-semibold px-3 h-8 hover:bg-white mx-1 rounded-[12px] text-slate-900 transition-all",
                                !currentDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-3 h-3.5 w-3.5 text-blue-500/60" />
                            <span className="capitalize text-[13px] tracking-tight text-center flex-1">
                                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-slate-100 shadow-xl rounded-[24px] overflow-hidden" align="center">
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

                <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 rounded-[12px] hover:bg-white text-slate-300 hover:text-slate-900 transition-all">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
