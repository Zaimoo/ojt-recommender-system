"use server";

import { createClient } from "@/lib/supabase/server";

interface AuditPayload {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

export async function logAudit({
  actorId,
  action,
  entityType,
  entityId,
  details,
}: AuditPayload) {
  const supabase = await createClient();

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? null,
  });

  if (error) {
    console.warn("[audit] Failed to log event:", error.message);
  }
}
