import { IWalletRepository } from "../repositories/wallet.repository.interface";
import { Wallet } from "../../domain/entities/finance";

export class WalletAppService {
    constructor(private readonly walletRepo: IWalletRepository) { }

    async getUserWallets() {
        return this.walletRepo.list();
    }

    async getInfo(id: string) {
        return this.walletRepo.getById(id);
    }

    async updateWallet(id: string, data: Partial<Wallet>) {
        // Regra de Negócio: Não permitir alteração manual de saldo aqui 
        // (deve ser via transação se for mudança financeira)
        if (data.balance !== undefined) {
            throw new Error("Alteração de saldo deve ser processada via Financial Transactions para garantir auditoria.");
        }
        return this.walletRepo.update(id, data);
    }

    async closeWallet(id: string) {
        const wallet = await this.walletRepo.getById(id);
        if (wallet.balance > 0) {
            throw new Error("Não é possível fechar uma carteira com saldo positivo. Transfira os fundos primeiro.");
        }
        return this.walletRepo.delete(id);
    }
}
