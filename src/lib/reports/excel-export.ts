import * as XLSX from "xlsx";
import { format } from "date-fns";

export interface ExcelExportData {
    sheetName: string;
    columns: BufferEncoding[];
    rows: any[];
}

export function exportToExcel(data: any[], fileName: string) {
    // 1. Prepare data for export (flattening nested objects)
    const formattedData = data.map(t => ({
        "Data": format(new Date(t.date), "dd/MM/yyyy"),
        "Descrição": t.description,
        "Categoria": t.category?.name || "Geral",
        "Tipo": t.type === 'income' ? 'Receita' : 'Despesa',
        "Valor (R$)": t.amount,
        "Status": t.status === 'completed' ? 'Efetivado' : 'Planejado',
        "Carteira": t.wallet?.name || "N/A"
    }));

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 3. Set column widths for readability
    const wscols = [
        { wch: 12 }, // Data
        { wch: 30 }, // Descrição
        { wch: 15 }, // Categoria
        { wch: 10 }, // Tipo
        { wch: 12 }, // Valor
        { wch: 12 }, // Status
        { wch: 20 }  // Carteira
    ];
    worksheet['!cols'] = wscols;

    // 4. Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transações");

    // 5. Generate and download file
    XLSX.writeFile(workbook, `${fileName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}
