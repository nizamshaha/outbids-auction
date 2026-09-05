import { createAdminClient } from '@/utils/supabase/admin';

export type AdminAuditEventType =
  | 'ADMIN_LOGIN_SUCCESS'
  | 'ADMIN_LOGIN_FAILED'
  | 'ADMIN_LOCKOUT_TRIGGERED'
  | 'ADMIN_LOGOUT'
  | 'ADMIN_CHANGED_PASSWORD'
  | 'ADMIN_SEEDED_BID'
  | 'ADMIN_UPDATED_BID'
  | 'ADMIN_DELETED_BID'
  | 'ADMIN_REFRESHED_METADATA';

export interface AuditLogPayload {
  action: AdminAuditEventType;
  actor?: string;
  targetId?: string;
  targetUrl?: string;
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  reason?: string;
  ipHash?: string;
}

/**
 * Records an immutable administrative audit event
 */
export async function recordAdminAuditLog(payload: AuditLogPayload): Promise<void> {
  const timestamp = new Date().toISOString();

  // 1. Structured Console Audit Stream
  console.log(
    `[SECURITY_AUDIT] [${timestamp}] [${payload.action}] ` +
      `TargetID: ${payload.targetId || 'N/A'} | TargetURL: ${payload.targetUrl || 'N/A'} | ` +
      `Actor: ${payload.actor || 'admin'} | IP: ${payload.ipHash || 'N/A'}`
  );

  // 2. Persist to Supabase audit table if table is configured
  try {
    const supabase = createAdminClient();
    await (supabase.from as any)('admin_audit_logs').insert({
      action: payload.action,
      actor: payload.actor || 'admin',
      target_id: payload.targetId || null,
      target_url: payload.targetUrl || null,
      previous_state: payload.previousState || null,
      new_state: payload.newState || null,
      reason: payload.reason || null,
      created_at: timestamp,
    });
  } catch (err) {
    // Non-fatal: Supabase table may be optional if schema not yet migrated
  }
}
