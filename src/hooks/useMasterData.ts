import { useQuery } from "@tanstack/react-query";
import { localDb } from "@/lib/localStorageDb";

export function useMasterData() {
  return useQuery({
    queryKey: ["master-data"],
    queryFn: async () => localDb.getMasterData(),
    staleTime: 5 * 60_000,
  });
}

export const KPI_SELECT = "local-storage";

export type KpiRow = ReturnType<typeof localDb.getKpiRecords>[number];

export async function fetchUserNames(ids: (string | null)[]): Promise<Record<string, string>> {
  return localDb.getUserNames(ids);
}
