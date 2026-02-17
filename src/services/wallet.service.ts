import { BaseService } from "./base.service";
import { Wallet } from "@/types/finance";

export class WalletService extends BaseService {
    static async list() {
        const userId = await this.getUserId();
        const { data, error } = await this.supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .order("name");

        if (error) throw error;
        return data as Wallet[];
    }

    static async create(data: Partial<Wallet>) {
        const userId = await this.getUserId();
        const { data: result, error } = await this.supabase
            .from("wallets")
            .insert([{ ...data, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return result as Wallet;
    }

    static async update(id: string, data: Partial<Wallet>) {
        const userId = await this.getUserId();
        const { data: result, error } = await this.supabase
            .from("wallets")
            .update(data)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;
        return result as Wallet;
    }

    static async delete(id: string) {
        const userId = await this.getUserId();
        const { error } = await this.supabase
            .from("wallets")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;
    }

    static async listTypes() {
        const userId = await this.getUserId();
        const { data, error } = await this.supabase
            .from("wallet_types")
            .select("*")
            .eq("user_id", userId)
            .order("name");

        if (error) throw error;
        return data;
    }
}
