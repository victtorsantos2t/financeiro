import { createClient } from "@/lib/supabase/client";
import { IWalletRepository } from "../../application/repositories/wallet.repository.interface";
import { Wallet } from "../../domain/entities/finance";

export class SupabaseWalletRepository implements IWalletRepository {
    private supabase = createClient();

    async list(): Promise<Wallet[]> {
        const { data, error } = await this.supabase
            .from("wallets")
            .select("*");

        if (error) {
            throw error;
        }

        return data as Wallet[];
    }

    async getById(id: string): Promise<Wallet> {
        const { data, error } = await this.supabase
            .from("wallets")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data as Wallet;
    }

    async update(id: string, data: Partial<Wallet>): Promise<Wallet> {
        const { data: result, error } = await this.supabase
            .from("wallets")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return result as Wallet;
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.supabase
            .from("wallets")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
}
