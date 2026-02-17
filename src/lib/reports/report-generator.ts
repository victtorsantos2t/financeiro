import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Add autotable type augmentation for TypeScript
declare module "jspdf" {
    interface jsPDF {
        autoTable: any;
    }
}

export interface ReportData {
    title: string;
    userName: string;
    period: string;
    summary: {
        totalIncome: number;
        totalExpense: number;
        netBalance: number;
        savingsRate: string;
    };
    transactions: any[];
    forecast?: any[];
}

export async function generateExecutiveReport(data: ReportData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header Section ---
    // Brand Accent
    doc.setFillColor(37, 99, 235); // primary hex #2563eb as RGB
    doc.rect(0, 0, pageWidth, 40, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO FINANCEIRO", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`GERADO PARA: ${data.userName.toUpperCase()}`, 20, 32);

    // --- Period Info ---
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(data.period, pageWidth - 20, 55, { align: "right" });

    // --- Key Metrics Grid ---
    // Income Card
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(20, 65, 52, 35, 4, 4, "F");
    doc.setTextColor(100, 116, 139); // slate-400
    doc.setFontSize(8);
    doc.text("TOTAL RECEITAS", 30, 75);
    doc.setTextColor(37, 99, 235); // primary
    doc.setFontSize(12);
    doc.text(`R$ ${data.summary.totalIncome.toLocaleString('pt-BR')}`, 30, 85);

    // Expense Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(77, 65, 52, 35, 4, 4, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text("TOTAL DESPESAS", 87, 75);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(`R$ ${data.summary.totalExpense.toLocaleString('pt-BR')}`, 87, 85);

    // Balance Card
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(134, 65, 56, 35, 4, 4, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text("BALANÇO LÍQUIDO", 144, 75);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(`R$ ${data.summary.netBalance.toLocaleString('pt-BR')}`, 144, 85);

    // --- Savings Rate Indicator ---
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(`Taxa de Poupança: ${data.summary.savingsRate}%`, 20, 115);

    // --- Transactions Table ---
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Últimas Movimentações", 20, 130);

    const tableRows = data.transactions.map(t => [
        format(new Date(t.date), "dd/MM/yyyy"),
        t.description,
        t.category?.name || "Geral",
        t.type === 'income' ? 'Receita' : 'Despesa',
        `R$ ${t.amount.toLocaleString('pt-BR')}`
    ]);

    doc.autoTable({
        startY: 135,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            font: 'helvetica'
        },
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold' }
        }
    });

    // --- Footer ---
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-300
    doc.text(`${data.title} - Gerado em ${format(new Date(), "PPpp", { locale: ptBR })}`, pageWidth / 2, 285, { align: "center" });
    doc.text("Confidencial - Uso Interno", pageWidth / 2, 290, { align: "center" });

    // Save PDF
    doc.save(`Relatorio_Financeiro_${format(new Date(), "yyyy_MM_dd")}.pdf`);
}
