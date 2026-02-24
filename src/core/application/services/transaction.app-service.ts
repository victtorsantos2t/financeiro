import { ITransactionRepository } from "../repositories/transaction.repository.interface";
import { Transaction } from "../../domain/entities/finance";
import { transactionSchema } from "@/lib/validations";

type Filters = {
    walletId?: string;
    startDate?: string;
    endDate?: string;
    types?: string[];
    sortOrder?: string;
};

export class TransactionAppService {
    constructor(private readonly transactionRepo: ITransactionRepository) { }

    async getHistory(filters?: Filters): Promise<Transaction[]> {
        const data = await this.transactionRepo.list(filters);
        return data.map(t => transactionSchema.parse(t) as Transaction);
    }

    async registerTransaction(data: Partial<Transaction>) {
        const validated = transactionSchema.partial().parse(data);

        if (validated.amount && validated.amount <= 0) {
            throw new Error("O valor da transação deve ser positivo.");
        }

        // Se tem id, é edição — chama update em vez de create
        if (validated.id) {
            const txId = validated.id;
            // Remove campos relacionais/read-only que não são colunas diretas
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _id, category: _cat, wallet: _wallet, deleted_at: _del, created_at: _created, user_id: _uid, ...updateData } = validated;
            return this.transactionRepo.update(txId, updateData as Partial<Transaction>);
        }

        return this.transactionRepo.create(validated as Partial<Transaction>);
    }

    async cancelTransaction(id: string) {
        return this.transactionRepo.delete(id);
    }

    async updateTransaction(id: string, data: Partial<Transaction>) {
        return this.transactionRepo.update(id, data);
    }
}
