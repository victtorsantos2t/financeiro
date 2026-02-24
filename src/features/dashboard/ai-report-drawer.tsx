"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { BrainCircuit, Download, FileText, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import jsPDF from "jspdf";

export function AIReportDrawer() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportText, setReportText] = useState("");
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (open && !reportText) {
            generateReport();
        }
    }, [open]);

    const generateReport = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const currentMonthYear = new Date().toISOString().slice(0, 7);
        const startOfMonth = `${currentMonthYear}-01`;
        const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString();

        try {
            const [txRes, budgetsRes, walletsRes] = await Promise.all([
                supabase.from("transactions").select("amount, type, category_id, date").eq("user_id", user.id).gte("date", startOfMonth).lte("date", endOfMonth),
                supabase.from("budgets").select("amount, category_id").eq("user_id", user.id).eq("month_year", currentMonthYear),
                supabase.from("wallets").select("balance").eq("user_id", user.id)
            ]);

            const transactions = txRes.data || [];
            const budgets = budgetsRes.data || [];
            const wallets = walletsRes.data || [];

            const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

            // Heuristics Engine
            const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
            let analysis = `**Resumo Financeiro - Atual**\n\n`;
            analysis += `Saldo Consolidado: R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
            analysis += `Entradas no mês:   R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
            analysis += `Saídas no mês:     R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
            analysis += `Balanço do Mês:    R$ ${(totalIncome - totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;

            analysis += `**Inteligência & Diagnóstico**\n\n`;

            if (totalIncome === 0 && totalExpense === 0) {
                analysis += `Não há movimentações registradas neste mês. Registre suas receitas e despesas para obter insights detalhados.\n\n`;
            } else {
                if (totalExpense > totalIncome) {
                    analysis += `⚠️ ALERTA: Você gastou mais do que ganhou neste mês. O déficit atual é de R$ ${(totalExpense - totalIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n`;
                    analysis += `Recomendação: Reveja imediatamente gastos em categorias não essenciais (lazer, compras). Considere liquidar investimentos de alta liquidez se precisar fechar o saldo negativo.\n\n`;
                } else {
                    analysis += `✅ SAUDÁVEL: Seu fluxo de caixa está positivo. Você conseguiu poupar ${savingsRate.toFixed(1)}% de suas receitas.\n`;
                    if (savingsRate >= 20) {
                        analysis += `Excelente disciplina! Você está dentro ou acima da regra de poupar 20% do orçamento.\n\n`;
                    } else {
                        analysis += `Dica: Tente reduzir um pouco os gastos não essenciais para tentar guardar 20% da sua renda.\n\n`;
                    }
                }

                if (budgets.length > 0) {
                    analysis += `**Análise de Orçamentos (Metas)**\n\n`;
                    let hasBudgetsVioated = false;
                    for (const budget of budgets) {
                        const spentInCat = transactions.filter(t => t.category_id === budget.category_id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                        if (spentInCat > budget.amount) {
                            hasBudgetsVioated = true;
                            analysis += `- Estouro de Meta: O gasto de R$ ${spentInCat.toLocaleString('pt-BR')} excedeu o limite de R$ ${budget.amount.toLocaleString('pt-BR')}.\n`;
                        } else if (spentInCat / budget.amount > 0.8) {
                            analysis += `- Atenção: Usou ${((spentInCat / budget.amount) * 100).toFixed(1)}% do limite de R$ ${budget.amount.toLocaleString('pt-BR')}.\n`;
                        }
                    }
                    if (!hasBudgetsVioated) {
                        analysis += `Parabéns, você não estourou nenhuma das metas estabelecidas para suas categorias.\n\n`;
                    } else {
                        analysis += `\nAjuste seu planejamento no próximo mês nas categorias que excederam o limite.\n\n`;
                    }
                }
            }

            analysis += `**Próximos Passos**\n1. Mantenha os saldos unificados das carteiras sempre corretos.\n2. Utilize a funcionalidade Ajustar Metas para conter os vazamentos de fluxo.\n3. Monitore diariamente.`;

            setReportText(analysis);
        } catch (error) {
            toast.error("Erro ao gerar relatório");
            setReportText("Ocorreu um erro ao gerar o relatório inteligente. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(reportText);
        setCopied(true);
        toast.success("Relatório copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.text("Relatório de Inteligência - VICNEX", 20, 20);

            doc.setFontSize(10);
            const lines = doc.splitTextToSize(reportText, 170);
            doc.text(lines, 20, 30);

            doc.save(`Relatorio_IA_VICNEX_${new Date().getTime()}.pdf`);
            toast.success("PDF baixado com sucesso!");
        } catch (e) {
            toast.error("Erro ao gerar PDF.");
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="h-[42px] px-6 gap-2 rounded-none border-2 border-border text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/50 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-none">
                    <BrainCircuit className="h-4 w-4 stroke-[3]" />
                    Relatório IA
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl p-0 border-l-2 border-border rounded-none shadow-none flex flex-col bg-card">
                <SheetHeader className="p-6 bg-background border-b-2 border-border">
                    <SheetTitle className="text-[14px] uppercase tracking-widest leading-none font-black text-foreground flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-primary" />
                        Diagnóstico IA Local
                    </SheetTitle>
                    <SheetDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">
                        Análise processada instantaneamente com base nos dados do mês atual.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden relative">
                    <div className="h-full overflow-y-auto border-b-2 border-border">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 h-full space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Processando dados financeiros...</p>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="bg-secondary p-6 font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed rounded-none border-2 border-border">
                                    {reportText}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-background flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] leading-tight text-center sm:text-left">
                        Relatório gerado localmente. Não utilizamos IA remota na versão atual.
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={copyToClipboard}
                            disabled={loading || !reportText}
                            className="flex-1 sm:flex-none"
                        >
                            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copied ? "Copiado" : "Copiar"}
                        </Button>
                        <Button
                            onClick={downloadPDF}
                            disabled={loading || !reportText}
                            className="flex-1 sm:flex-none"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Salvar PDF
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// aria-label
