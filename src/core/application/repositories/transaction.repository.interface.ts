import { Transaction } from "../../domain/entities/finance";

export interface ITransactionRepository {
    list(filters?: any): Promise<Transaction[]>;
    create(data: Partial<Transaction>): Promise<Transaction>;
    update(id: string, data: Partial<Transaction>): Promise<Transaction>;
    delete(id: string): Promise<void>;
}
