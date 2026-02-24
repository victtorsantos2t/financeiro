"use client";

import { useState } from "react";
import { ChevronLeft, Info, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToExcel } from "@/lib/reports/excel-export";

interface ExportStatementScreenProps {
    onBack: () => void;
    onExportComplete: () => void;
}

const PERIODS = [
    { id: "30", label: "Últimos 30 dias" },
    { id: "60", label: "Últimos 60 dias" },
    { id: "90", label: "Últimos 90 dias" },
    { id: "1s2026", label: "1º semestre 2026" },
    { id: "2s2025", label: "2º semestre 2025" },
];

const FORMATS = [
    { id: "pdf", label: "PDF", icon: FileText, description: "Ideal para impressão e leitura rápida" },
    { id: "excel", label: "Excel", icon: FileSpreadsheet, description: "Ideal para análise e cálculos" },
];

export function ExportStatementScreen({ onBack, onExportComplete }: ExportStatementScreenProps) {
    const [selectedPeriod, setSelectedPeriod] = useState("60");
    const [selectedFormat, setSelectedFormat] = useState("pdf");
    const [exporting, setExporting] = useState(false);
    const supabase = createClient();

    const handleExport = async () => {
        setExporting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setExporting(false);
            return;
        }

        let startDate = new Date();
        const now = new Date();

        // Calculate start date based on selection
        switch (selectedPeriod) {
            case "30": startDate = subDays(now, 30); break;
            case "60": startDate = subDays(now, 60); break;
            case "90": startDate = subDays(now, 90); break;
            case "1s2026": startDate = new Date(2026, 0, 1); break;
            case "2s2025": startDate = new Date(2025, 6, 1); break;
        }

        const { data: transactions } = await supabase
            .from("transactions")
            .select("*, category:categories(name), wallet:wallets(name)")
            .eq("user_id", user.id)
            .gte("date", startDate.toISOString())
            .lte("date", now.toISOString())
            .order("date", { ascending: false });

        if (transactions && transactions.length > 0) {
            if (selectedFormat === 'pdf') {
                const doc = new jsPDF();
                doc.setFontSize(20);
                doc.text("Extrato Financeiro", 14, 22);
                doc.setFontSize(10);
                doc.text(`Período: ${format(startDate, "dd/MM/yyyy")} até ${format(now, "dd/MM/yyyy")}`, 14, 30);

                const tableData = transactions.map(t => [
                    format(new Date(t.date), "dd/MM/yyyy"),
                    t.description,
                    t.category?.name || "Geral",
                    t.type === 'income' ? 'Entrada' : 'Saída',
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)
                ]);

                autoTable(doc, {
                    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
                    body: tableData,
                    startY: 40,
                    headStyles: { fillColor: [0, 0, 0] },
                });

                doc.save(`extrato_${selectedPeriod}dias_${format(now, "yyyyMMdd")}.pdf`);
            } else {
                exportToExcel(transactions, `extrato_${selectedPeriod}dias`);
            }
            onExportComplete();
        }
        setExporting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 bg-background z-[100] flex flex-col pt-safe overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-secondary/50 shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-none border border-transparent hover:border-border transition-all">
                    <ChevronLeft className="h-6 w-6 stroke-[3]" />
                </button>
                <h1 className="text-sm font-black uppercase tracking-widest text-foreground">Exportar extrato</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
                <h2 className="text-[18px] font-black uppercase tracking-wides text-foreground leading-tight mb-8 max-w-[320px]">
                    Configure como deseja exportar seu extrato
                </h2>

                {/* Format Selection */}
                <div className="mb-10">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Formato do arquivo</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {FORMATS.map((format) => (
                            <button
                                key={format.id}
                                onClick={() => setSelectedFormat(format.id)}
                                className={cn(
                                    "flex flex-col items-start p-4 rounded-none border-2 transition-all text-left group active:scale-95",
                                    selectedFormat === format.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-none mb-3 transition-colors border",
                                    selectedFormat === format.id ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <format.icon className="h-5 w-5 stroke-[2.5]" />
                                </div>
                                <span className={cn(
                                    "text-[10px] uppercase tracking-widest font-black mb-1",
                                    selectedFormat === format.id ? "text-primary" : "text-foreground"
                                )}>
                                    {format.label}
                                </span>
                                <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold leading-relaxed mt-1">
                                    {format.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Period Selection */}
                <div>
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Período</h3>
                    <div className="space-y-0 text-foreground border-y border-border">
                        {PERIODS.map((period) => (
                            <div
                                key={period.id}
                                onClick={() => setSelectedPeriod(period.id)}
                                className="group flex items-center justify-between py-5 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/20 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">{period.label}</span>
                                </div>

                                <div className={cn(
                                    "w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all bg-transparent p-0.5",
                                    selectedPeriod === period.id
                                        ? "border-primary bg-primary"
                                        : "border-border group-hover:border-primary/50"
                                )}>
                                    {/* Omiting inner dot for brutalist checkbox style, we used bg-primary directly above */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex gap-4 p-5 bg-background border-2 border-border rounded-none">
                    <Info className="h-5 w-5 text-foreground shrink-0 stroke-[3]" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold leading-relaxed">
                        O arquivo gerado conterá todas as transações do período selecionado, categorizadas e detalhadas para sua conferência.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-card pb-safe-bottom shrink-0 w-full">
                <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full h-[42px] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-none transition-all active:scale-95 shadow-none border border-primary"
                >
                    {exporting ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Gerando arquivo...
                        </span>
                    ) : (
                        `Gerar extrato em ${selectedFormat.toUpperCase()}`
                    )}
                </Button>
            </div>
        </motion.div>
    );
}

// aria-label
