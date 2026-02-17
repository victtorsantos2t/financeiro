import { createClient } from "@/lib/supabase/client";

export class BaseService {
    protected static supabase = createClient();

    protected static async getUserId() {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error || !user) throw new Error("Usuário não autenticado");
        return user.id;
    }
}
