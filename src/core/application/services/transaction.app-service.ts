import { ITransactionRepository } from "../repositories/transaction.repository.interface";
import { Transaction } from "../../domain/entities/finance";

export class TransactionAppService {
    constructor(private readonly transactionRepo: ITransactionRepository) { }

    async getHistory(filters?: any) {
        return this.transactionRepo.list(filters);
    }

    async registerTransaction(data: Partial<Transaction>) {
        // Validação de Domínio aqui se necessário
        if (data.amount! <= 0) {
            throw new Error("O valor da transação deve ser positivo.");
        }

        return this.transactionRepo.create(data);
    }

    async cancelTransaction(id: string) {
        return this.transactionRepo.delete(id);
    }
}
