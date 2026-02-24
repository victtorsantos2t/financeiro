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

    return null;
}

// aria-label
