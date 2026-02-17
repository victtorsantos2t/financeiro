"use client";

import { useState } from "react";
import { ChevronLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportStatementScreenProps {
    onBack: () => void;
    onExportComplete: () => void;
}

const PERIODS = [
    { id: "30", label: "Últimos 30 dias" },
    { id: "60", label: "Últimos 60 dias", sublabel: "Período selecionado: 19/12/2025 a 17/02/2026" },
    { id: "90", label: "Últimos 90 dias" },
    { id: "1s2026", label: "1º semestre 2026" },
    { id: "2s2025", label: "2º semestre 2025" },
];

export function ExportStatementScreen({ onBack, onExportComplete }: ExportStatementScreenProps) {
    const [selectedPeriod, setSelectedPeriod] = useState("60");
    const [exporting, setExporting] = useState(false);
    const supabase = createClient();

    const handleExport = async () => {
        setExporting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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
                headStyles: { fillColor: [0, 0, 0] }, // System Black
            });

            doc.save(`extrato_${selectedPeriod}dias_${format(now, "yyyyMMdd")}.pdf`);
            onExportComplete();
        }
        setExporting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col pt-safe"
        >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-900 hover:bg-slate-50 rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold text-slate-900">Exportar extrato</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-10 max-w-[300px]">
                    Selecione o período que deseja exportar seu extrato
                </h2>

                <div className="space-y-0 text-slate-900">
                    {PERIODS.map((period) => (
                        <div
                            key={period.id}
                            onClick={() => setSelectedPeriod(period.id)}
                            className="group flex items-center justify-between py-6 border-b border-slate-100 cursor-pointer active:bg-slate-50 transition-colors"
                        >
                            <div className="flex flex-col">
                                <span className="text-base font-medium">{period.label}</span>
                                {period.sublabel && (
                                    <span className="text-sm text-slate-400 mt-1">{period.sublabel}</span>
                                )}
                            </div>

                            <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                selectedPeriod === period.id
                                    ? "border-slate-900"
                                    : "border-slate-200 group-hover:border-slate-300"
                            )}>
                                {selectedPeriod === period.id && (
                                    <div className="w-3 h-3 rounded-full bg-slate-900" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex gap-3">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Para períodos anteriores, acesse o seu extrato pelo computador no site do Itaú.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50 bg-white pb-safe-bottom">
                <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                >
                    {exporting ? "Gerando..." : "Gerar extrato"}
                </Button>
            </div>
        </motion.div>
    );
}
