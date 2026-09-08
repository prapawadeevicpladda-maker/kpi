import { useQuery } from "@tanstack/react-query";
import { localDb } from "@/lib/localStorageDb";
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
    queryFn: async () => localDb.getAuthState(),
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
  localDb.addAudit(action, entity, entityId, detail);
}
