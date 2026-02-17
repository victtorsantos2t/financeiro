import { createClient } from "@/lib/supabase/client";
import { AuditLog } from "../../domain/entities/finance";

export class EnterpriseLogger {
    private static supabase = createClient();

    static async log(
        eventType: AuditLog['event_type'],
        metadata: any,
        severity: AuditLog['severity'] = 'info'
    ) {
        const { data: { user } } = await this.supabase.auth.getUser();

        if (!user) {
            console.error("[EnterpriseLogger] Tentativa de log sem usuário autenticado", { eventType, metadata });
            return;
        }

        const { error } = await this.supabase
            .from("audit_events")
            .insert([{
                user_id: user.id,
                event_type: eventType,
                metadata,
                severity
            }]);

        if (error) {
            console.error("[EnterpriseLogger] Erro ao persistir log de auditoria", error);
        }
    }

    static async logSecurityViolation(details: any) {
        await this.log('AUTH_FAILURE', details, 'critical');
    }

    static async logBalanceInconsistency(details: any) {
        await this.log('BALANCE_INCONSISTENCY', details, 'error');
    }
}
