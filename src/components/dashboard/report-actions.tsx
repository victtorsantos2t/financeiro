"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { generateExecutiveReport } from "@/lib/reports/report-generator";
import { exportToExcel } from "@/lib/reports/excel-export";
import { createClient } from "@/lib/supabase/client";
import { calculateHealthMetrics } from "@/lib/intelligence/forecasting";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportActionsProps {
    currentDate?: Date;
}

export function ReportActions({ currentDate = new Date() }: ReportActionsProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const supabase = createClient();

    const fetchReportData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: transactions } = await supabase
            .from("transactions")
            .select("*, category:categories(name), wallet:wallets(name)")
            .eq("user_id", user.id)
            .order("date", { ascending: false });

        const { data: wallets } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", user.id);

        if (!transactions || !wallets) return null;

        const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
        const income = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);

        const metrics = calculateHealthMetrics(transactions as any, totalBalance);

        return {
            title: "Dashboard Financeiro",
            userName: user.email?.split('@')[0] || "Usuário",
            period: format(currentDate, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase(),
            summary: {
                totalIncome: income,
                totalExpense: expense,
                netBalance: income - expense,
                savingsRate: metrics.savingsRate.toString()
            },
            transactions: transactions.slice(0, 20), // Top 20 for PDF
            allTransactions: transactions // For Excel
        };
    };

    const handlePdfGeneration = async () => {
        setIsGeneratingPdf(true);
        try {
            const data = await fetchReportData();
            if (data) {
                await generateExecutiveReport(data);
                toast.success("Relatório PDF gerado com sucesso!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleExcelExport = async () => {
        setIsExportingExcel(true);
        try {
            const data = await fetchReportData();
            if (data) {
                exportToExcel(data.allTransactions, "Relatorio_Financeiro");
                toast.success("Planilha Excel exportada com sucesso!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao exportar Excel.");
        } finally {
            setIsExportingExcel(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handlePdfGeneration}
                disabled={isGeneratingPdf}
                className="h-9 rounded-[12px] border-slate-100 bg-white/50 text-slate-500 hover:text-blue-600 hover:bg-white hover:border-blue-500/20 transition-all shadow-none flex items-center gap-2 px-4"
            >
                {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span className="hidden sm:inline text-[13px] font-semibold tracking-tight">PDF</span>
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={handleExcelExport}
                disabled={isExportingExcel}
                className="h-9 rounded-[12px] border-slate-100 bg-white/50 text-slate-500 hover:text-emerald-600 hover:bg-white hover:border-emerald-500/20 transition-all shadow-none flex items-center gap-2 px-4"
            >
                {isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                <span className="hidden sm:inline text-[13px] font-semibold tracking-tight">Excel</span>
            </Button>
        </div>
    );
}
