import { BaseService } from "./base.service";
import { Category } from "@/types/finance";

export class CategoryService extends BaseService {
    static async list() {
        const userId = await this.getUserId();
        const { data, error } = await this.supabase
            .from("categories")
            .select("*")
            .eq("user_id", userId)
            .order("name");

        if (error) throw error;
        return data as Category[];
    }

    static async create(data: Partial<Category>) {
        const userId = await this.getUserId();
        const { data: result, error } = await this.supabase
            .from("categories")
            .insert([{ ...data, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return result as Category;
    }

    static async delete(id: string) {
        const userId = await this.getUserId();
        const { error } = await this.supabase
            .from("categories")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;
    }

    static async loadDefaults(defaults: any[]) {
        const userId = await this.getUserId();
        const categoriesToInsert = defaults.map(cat => ({
            ...cat,
            user_id: userId,
            icon: "circle",
            color: "#000000"
        }));

        const { error } = await this.supabase.from("categories").insert(categoriesToInsert);
        if (error) throw error;
    }
}
