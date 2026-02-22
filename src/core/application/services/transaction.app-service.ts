import { ITransactionRepository } from "../repositories/transaction.repository.interface";
import { Transaction } from "../../domain/entities/finance";
import { transactionSchema } from "@/lib/validations";

export class TransactionAppService {
    constructor(private readonly transactionRepo: ITransactionRepository) { }

    async getHistory(filters?: any): Promise<Transaction[]> {
        const data = await this.transactionRepo.list(filters);
        // Validar cada transação vinda do banco e garantir o tipo de retorno
        return data.map(t => transactionSchema.parse(t) as Transaction);
    }

    async registerTransaction(data: Partial<Transaction>) {
        // Validação com Zod antes de enviar ao repositório
        const validated = transactionSchema.partial().parse(data);

        if (validated.amount && validated.amount <= 0) {
            throw new Error("O valor da transação deve ser positivo.");
        }

        return this.transactionRepo.create(validated as any);
    }

    async cancelTransaction(id: string) {
        return this.transactionRepo.delete(id);
    }
}
