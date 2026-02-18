import { createClient } from "@/lib/supabase/client";
import { ITransactionRepository } from "../../application/repositories/transaction.repository.interface";
import { Transaction } from "../../domain/entities/finance";

export class SupabaseTransactionRepository implements ITransactionRepository {
    private supabase = createClient();

    async list(filters?: any): Promise<Transaction[]> {
        let query = this.supabase
            .from("transactions")
            .select("*, category:categories(name), wallet:wallets(name)");

        if (filters?.walletId) {
            query = query.eq("wallet_id", filters.walletId);
        }

        const { data, error } = await query.order("date", { ascending: false });
        if (error) throw error;
        return data as Transaction[];
    }

    async create(data: Partial<Transaction>): Promise<Transaction> {
        // Chamada via RPC para garantir atomicidade e proteção de saldo no banco
        const { data: result, error } = await this.supabase.rpc('create_financial_transaction', {
            p_description: data.description,
            p_amount: data.amount,
            p_type: data.type,
            p_date: data.date,
            p_category_id: data.category_id,
            p_wallet_id: data.wallet_id,
            p_payment_method: data.payment_method,
            p_status: data.status,
            p_is_recurring: data.is_recurring,
            p_recurrence_interval: data.recurrence_interval,
            p_destination_wallet_id: data.destination_wallet_id
        });

        if (error) throw error;
        if (!result.success) throw new Error(result.error);

        // Re-fetch to get complete object if needed or return based on result
        return { id: result.id, ...data } as Transaction;
    }

    async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
        const { data: result, error } = await this.supabase
            .from("transactions")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return result as Transaction;
    }

    async delete(id: string): Promise<void> {
        const { data: result, error } = await this.supabase.rpc('delete_financial_transaction', {
            p_tx_id: id
        });

        if (error) throw error;
        if (!result.success) throw new Error(result.error);
    }
}
