import { createClient } from "@/lib/supabase/client";
import { Category } from "../../domain/entities/finance";

export interface ICategoryRepository {
    list(type?: 'income' | 'expense'): Promise<Category[]>;
}

export class SupabaseCategoryRepository implements ICategoryRepository {
    private supabase = createClient();

    async list(type?: 'income' | 'expense'): Promise<Category[]> {
        console.log('[CategoryRepo] Iniciando list(), type:', type);

        let query = this.supabase
            .from("categories")
            .select("*")
            .order("name");

        if (type) {
            query = query.eq("type", type);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[CategoryRepo] Erro ao buscar categorias:', error);
            throw error;
        }

        console.log('[CategoryRepo] Categorias carregadas:', data?.length || 0);
        return data as Category[];
    }
}
