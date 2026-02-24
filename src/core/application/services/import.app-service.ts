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

    async parsePDFText(fileContentText: string): Promise<ImportedTransaction[]> {
        const transactions: ImportedTransaction[] = [];

        // Debug: mostrar os primeiros 800 caracteres do texto extraido no browser console
        console.log('[PDF Import] Texto bruto extraido (primeiros 800 chars):', fileContentText.substring(0, 800));
        console.log('[PDF Import] Total de characters:', fileContentText.length);

        // Normaliza o texto: remove espacos multiplos, limpa linhas
        const lines = fileContentText
            .split(/[\n\r]+/)
            .map(l => l.trim())
            .filter(Boolean);

        // Regex para correspondencias de data DD/MM/YYYY isolada ou iniciando a linha
        const dateRegex = /^(\d{2}\/\d{2}\/\d{4})$/;
        const valueRegex = /^[\-\+]?\d{1,3}(\.\d{3})*,\d{2}$/;
        const pureValueRegex = /^[\-\+]?\d+,\d{2}$/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Case 1: All in one line "23/02/2026 PAY FAST 21/02 -21,00"
            const fullLineMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)/);
            if (fullLineMatch) {
                const dateStr = fullLineMatch[1];
                const rest = fullLineMatch[2];

                if (rest.toUpperCase().includes('SALDO DO DIA') || rest.toUpperCase().includes('S A L D O') || rest.toUpperCase().includes('SALDO')) {
                    continue; // Pular saldos diários ou finais
                }

                const chunks = rest.split(/\s+/);
                const potentialValues = [];
                // Look from right to left for monetary values
                for (let j = chunks.length - 1; j >= 0; j--) {
                    if (valueRegex.test(chunks[j]) || pureValueRegex.test(chunks[j])) {
                        potentialValues.push(chunks[j]);
                    } else {
                        break;
                    }
                }

                if (potentialValues.length > 0) {
                    // if there are multiple monetary values, the transaction value is usually the first encountered from right to left if only 1, 
                    // or if 2: [balance, transactionAmount], so potentialValues[1] is the transaction amount.
                    const valueStr = potentialValues.length > 1 ? potentialValues[1] : potentialValues[0];
                    let description = rest;
                    for (const val of potentialValues) {
                        description = description.replace(val, '');
                    }
                    description = description.trim();

                    const amountNumber = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));
                    const [day, month, year] = dateStr.split('/');
                    transactions.push(importedTransactionSchema.parse({
                        description: description || "Transação Importada",
                        amount: Math.abs(amountNumber),
                        date: `${year}-${month}-${day}`,
                        type: amountNumber >= 0 ? 'income' : 'expense',
                        fitid: `PDF-${year}${month}${day}-${Math.random().toString(36).substr(2, 9)}`
                    }));
                }
            } else if (dateRegex.test(line)) {
                // Case 2: Information split across multiple lines
                const dateStr = line;
                let j = i + 1;
                const desc = [];
                let valStr = "";

                while (j < lines.length && !dateRegex.test(lines[j]) && !lines[j].match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)/)) {
                    if (valueRegex.test(lines[j]) || pureValueRegex.test(lines[j])) {
                        valStr = lines[j];
                        break;
                    } else {
                        desc.push(lines[j]);
                    }
                    j++;
                }

                if (valStr && desc.length > 0) {
                    const joinedDesc = desc.join(' ').trim();
                    if (!joinedDesc.toUpperCase().includes('SALDO')) {
                        const amountNumber = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
                        const [day, month, year] = dateStr.split('/');
                        transactions.push(importedTransactionSchema.parse({
                            description: joinedDesc || "Transação Importada",
                            amount: Math.abs(amountNumber),
                            date: `${year}-${month}-${day}`,
                            type: amountNumber >= 0 ? 'income' : 'expense',
                            fitid: `PDF-${year}${month}${day}-${Math.random().toString(36).substr(2, 9)}`
                        }));
                    }
                    i = j;
                }
            }
        }

        return transactions;
    }
}
