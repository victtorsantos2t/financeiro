import { SupabaseTransactionRepository } from "../../infrastructure/repositories/supabase-transaction.repository";
import { SupabaseWalletRepository } from "../../infrastructure/repositories/supabase-wallet.repository";
import { SupabaseCategoryRepository } from "../../infrastructure/repositories/supabase-category.repository";
import { TransactionAppService } from "./transaction.app-service";
import { WalletAppService } from "./wallet.app-service";
import { HealthAppService } from "./health.app-service";
import { ImportAppService } from "./import.app-service";

/**
 * Service Factory (Composition Root)
 * Centraliza a criação de instâncias para garantir Singleton pattern
 * e facilitar a troca de implementações no futuro (ex: Mock para Testes).
 */
class ServiceFactory {
    // Repositories
    private transactionRepo = new SupabaseTransactionRepository();
    private walletRepo = new SupabaseWalletRepository();
    private categoryRepo = new SupabaseCategoryRepository();

    // Application Services
    public readonly transactions = new TransactionAppService(this.transactionRepo);
    public readonly wallets = new WalletAppService(this.walletRepo);
    public readonly health = new HealthAppService(this.transactionRepo, this.walletRepo);
    public readonly import = new ImportAppService();
    public readonly categories = {
        list: (type?: 'income' | 'expense' | 'transfer') => this.categoryRepo.list(type as any)
    };
}

export const services = new ServiceFactory();
