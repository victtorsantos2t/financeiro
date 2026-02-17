import { ITransactionRepository } from "../repositories/transaction.repository.interface";
import { IWalletRepository } from "../repositories/wallet.repository.interface";

export class HealthAppService {
    constructor(
        private readonly transactionRepo: ITransactionRepository,
        private readonly walletRepo: IWalletRepository
    ) { }

    async calculateHealthScore() {
        const [wallets, transactions] = await Promise.all([
            this.walletRepo.list(),
            this.transactionRepo.list()
        ]);

        const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);

        // Regra de Negócio Enterprise: 
        // Score baseado em balanço vs despesas dos últimos 30 dias
        const expenses = transactions
            .filter(t => t.type === 'expense' && t.status === 'completed')
            .reduce((acc, curr) => acc + curr.amount, 0);

        if (expenses === 0) return { score: 100, diagnosis: "Excelente", color: "text-emerald-500", insights: ["Sem despesas registradas."], recommendations: ["Continue gerenciando suas entradas."] };

        const ratio = totalBalance / expenses;

        if (ratio >= 2) return { score: 95, diagnosis: "Saudável", color: "text-emerald-500", insights: ["Reserva de emergência sólida."], recommendations: ["Considere investimentos de longo prazo."] };
        if (ratio >= 1) return { score: 75, diagnosis: "Estável", color: "text-blue-500", insights: ["Balanço positivo."], recommendations: ["Tente reduzir gastos variáveis."] };

        return { score: 45, diagnosis: "Atenção", color: "text-amber-500", insights: ["Despesas próximas ao limite do saldo."], recommendations: ["Corte gastos não essenciais imediatamente."] };
    }
}
