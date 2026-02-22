import { importedTransactionSchema, ImportedTransaction } from "@/lib/validations";
const { parse } = require("ofx-js");

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
            const imported = {
                description: item.MEMO || item.NAME || "Transação Importada",
                amount: Math.abs(amount),
                date: this.parseOFXDate(item.DTPOSTED),
                type: (amount >= 0 ? 'income' : 'expense') as 'income' | 'expense',
                fitid: item.FITID
            };
            transactions.push(importedTransactionSchema.parse(imported));
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

            return list.map((item: any) => {
                const imported = {
                    description: item.description || item.memo || "Transação JSON",
                    amount: Math.abs(item.amount),
                    date: item.date || new Date().toISOString().split('T')[0],
                    type: (item.amount >= 0 ? 'income' : 'expense') as 'income' | 'expense',
                    fitid: item.id
                };
                return importedTransactionSchema.parse(imported);
            });
        } catch (e) {
            if (e instanceof Error && e.name === 'ZodError') throw e;
            throw new Error("Formato JSON inválido para importação.");
        }
    }
}
