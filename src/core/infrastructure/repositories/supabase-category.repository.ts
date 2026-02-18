import { createClient } from "@/lib/supabase/client";
import { Category } from "../../domain/entities/finance";

export interface ICategoryRepository {
    list(type?: 'income' | 'expense'): Promise<Category[]>;
}

export class SupabaseCategoryRepository implements ICategoryRepository {
    private supabase = createClient();

    async list(type?: 'income' | 'expense'): Promise<Category[]> {
        let query = this.supabase
            .from("categories")
            .select("*")
            .order("name");

        if (type) {
            query = query.eq("type", type);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return data as Category[];
    }
}
