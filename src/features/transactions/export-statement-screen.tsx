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
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold text-foreground">Exportar extrato</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
                <h2 className="text-2xl font-bold text-foreground leading-tight mb-8 max-w-[320px]">
                    Configure como deseja exportar seu extrato
                </h2>

                {/* Format Selection */}
                <div className="mb-10">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Formato do arquivo</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {FORMATS.map((format) => (
                            <button
                                key={format.id}
                                onClick={() => setSelectedFormat(format.id)}
                                className={cn(
                                    "flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left group active:scale-95",
                                    selectedFormat === format.id
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border hover:border-border/80"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-xl mb-3 transition-colors",
                                    selectedFormat === format.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                                )}>
                                    <format.icon className="h-5 w-5" />
                                </div>
                                <span className={cn(
                                    "text-sm font-bold mb-1",
                                    selectedFormat === format.id ? "text-primary" : "text-foreground"
                                )}>
                                    {format.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                    {format.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Period Selection */}
                <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Período</h3>
                    <div className="space-y-0 text-foreground">
                        {PERIODS.map((period) => (
                            <div
                                key={period.id}
                                onClick={() => setSelectedPeriod(period.id)}
                                className="group flex items-center justify-between py-5 border-b border-border cursor-pointer hover:bg-secondary/50 active:bg-secondary transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">{period.label}</span>
                                </div>

                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedPeriod === period.id
                                        ? "border-primary"
                                        : "border-border group-hover:border-foreground/50"
                                )}>
                                    {selectedPeriod === period.id && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex gap-3 p-4 bg-secondary rounded-2xl">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        O arquivo gerado conterá todas as transações do período selecionado, categorizadas e detalhadas para sua conferência.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-background pb-safe-bottom shrink-0">
                <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                    {exporting ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
