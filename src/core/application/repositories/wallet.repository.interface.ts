import { Wallet } from "../../domain/entities/finance";

export interface IWalletRepository {
    list(): Promise<Wallet[]>;
    getById(id: string): Promise<Wallet>;
    update(id: string, data: Partial<Wallet>): Promise<Wallet>;
    delete(id: string): Promise<void>;
}
