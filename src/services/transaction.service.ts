import { BaseService } from "./base.service";
import { Transaction } from "@/types/finance";

export class TransactionService extends BaseService {
    static async list(filters?: { activeTab?: 'recentes' | 'futuros', walletId?: string }) {
        const userId = await this.getUserId();

        let query = this.supabase
            .from("transactions")
            .select("*, category:categories(name), wallet:wallets(name)")
            .eq("user_id", userId);

        if (filters?.walletId) {
            query = query.eq("wallet_id", filters.walletId);
        }

        const now = new Date().toISOString();
        if (filters?.activeTab === 'recentes') {
            query = query.lte('date', now);
        } else if (filters?.activeTab === 'futuros') {
            query = query.gt('date', now).neq('status', 'completed');
        }

        const { data, error } = await query.order("date", { ascending: false });
        if (error) throw error;
        return data as Transaction[];
    }

    static async create(data: Partial<Transaction>) {
        const userId = await this.getUserId();

        const { data: result, error } = await this.supabase
            .from("transactions")
            .insert([{ ...data, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return result as Transaction;
    }

    static async update(id: string, data: Partial<Transaction>) {
        const userId = await this.getUserId();
        const { data: result, error } = await this.supabase
            .from("transactions")
            .update(data)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;
        return result as Transaction;
    }

    static async delete(id: string) {
        const userId = await this.getUserId();
        const { error } = await this.supabase
            .from("transactions")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;
    }
}
