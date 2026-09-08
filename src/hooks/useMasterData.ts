import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMasterData() {
  return useQuery({
    queryKey: ["master-data"],
    queryFn: async () => {
      const [shifts, lines, machines, products, defectTypes, downtimeReasons] = await Promise.all([
        supabase.from("shifts").select("*").order("code"),
        supabase.from("production_lines").select("*").order("code"),
        supabase.from("machines").select("*").order("code"),
        supabase.from("products").select("*").order("code"),
        supabase.from("defect_types").select("*").order("code"),
        supabase.from("downtime_reasons").select("*").order("code"),
      ]);
      return {
        shifts: shifts.data ?? [],
        lines: lines.data ?? [],
        machines: machines.data ?? [],
        products: products.data ?? [],
        defectTypes: defectTypes.data ?? [],
        downtimeReasons: downtimeReasons.data ?? [],
      };
    },
    staleTime: 5 * 60_000,
  });
}

export const KPI_SELECT =
  "*, shifts(code,name), production_lines(code,name), machines(code,name), products(code,name,unit)";

export type KpiRow = {
  id: string;
  prod_date: string;
  shift_id: string;
  line_id: string;
  machine_id: string | null;
  product_id: string | null;
  work_order: string | null;
  planned_minutes: number;
  target_qty: number;
  actual_qty: number;
  good_qty: number;
  defect_qty: number;
  scrap_qty: number;
  rework_qty: number;
  raw_material_qty: number | null;
  downtime_minutes: number;
  manpower: number;
  cycle_time_sec: number | null;
  remark: string | null;
  status: "draft" | "pending" | "approved" | "rejected";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  achievement_rate: number | null;
  defect_rate: number | null;
  quality_rate: number | null;
  availability: number | null;
  yield_rate: number | null;
  shifts?: { code: string; name: string } | null;
  production_lines?: { code: string; name: string } | null;
  machines?: { code: string; name: string } | null;
  products?: { code: string; name: string; unit: string } | null;
};

/** ดึงชื่อผู้ใช้งานจากรายการ user id (สำหรับแสดงผู้บันทึก / ผู้อนุมัติ) */
export async function fetchUserNames(ids: (string | null)[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter((v): v is string => !!v)));
  if (unique.length === 0) return {};
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", unique);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.id] = row.full_name || "-";
  return map;
}
