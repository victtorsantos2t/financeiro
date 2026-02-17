import { Transaction } from "../../domain/entities/finance";
const { parse } = require("ofx-js");

export interface ImportedTransaction {
    id?: string;
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    fitid?: string; // Financial Institution Transaction ID
}

export class ImportAppService {
    async parseOFX(fileContent: string): Promise<ImportedTransaction[]> {
        const data = await parse(fileContent);
        const transactions: ImportedTransaction[] = [];

        // Caminho comum no JSON gerado pelo ofx-js:
        // OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN
        const stmtTrn = data?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN;

        if (!stmtTrn) return [];

        const list = Array.isArray(stmtTrn) ? stmtTrn : [stmtTrn];

        for (const item of list) {
            const amount = parseFloat(item.TRNAMT);
            transactions.push({
                description: item.MEMO || item.NAME || "Transação Importada",
                amount: Math.abs(amount),
                date: this.parseOFXDate(item.DTPOSTED),
                type: amount >= 0 ? 'income' : 'expense',
                fitid: item.FITID
            });
        }

        return transactions;
    }

    private parseOFXDate(ofxDate: string): string {
        // Exemplo OFX date: 20231025120000[-03:EST] -> YYYYMMDD
        const year = ofxDate.substring(0, 4);
        const month = ofxDate.substring(4, 6);
        const day = ofxDate.substring(6, 8);
        return `${year}-${month}-${day}`;
    }

    async parseJSON(fileContent: string): Promise<ImportedTransaction[]> {
        try {
            const data = JSON.parse(fileContent);
            const list = Array.isArray(data) ? data : (data.transactions || []);

            return list.map((item: any) => ({
                description: item.description || item.memo || "Transação JSON",
                amount: Math.abs(item.amount),
                date: item.date || new Date().toISOString().split('T')[0],
                type: item.amount >= 0 ? 'income' : 'expense',
                fitid: item.id
            }));
        } catch (e) {
            throw new Error("Formato JSON inválido para importação.");
        }
    }
}
