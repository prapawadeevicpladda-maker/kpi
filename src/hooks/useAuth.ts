import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/kpi";

export type AuthState = {
  userId: string | null;
  email: string | null;
  fullName: string;
  roles: AppRole[];
  isActive: boolean;
  loading: boolean;
};

export function useAuth(): AuthState {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-state"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("full_name, is_active").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      return {
        userId: user.id,
        email: user.email ?? null,
        fullName: profile?.full_name || user.email || "ผู้ใช้งาน",
        isActive: profile?.is_active ?? true,
        roles: (roleRows ?? []).map((r) => r.role as AppRole),
      };
    },
    staleTime: 60_000,
  });

  return {
    userId: data?.userId ?? null,
    email: data?.email ?? null,
    fullName: data?.fullName ?? "",
    roles: data?.roles ?? [],
    isActive: data?.isActive ?? true,
    loading: isLoading,
  };
}

export async function logAudit(
  action: string,
  entity: string,
  entityId?: string | null,
  detail?: Record<string, unknown>,
) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({
    user_id: data.user.id,
    action,
    entity,
    entity_id: entityId ?? null,
    detail: detail ?? null,
  });
}
