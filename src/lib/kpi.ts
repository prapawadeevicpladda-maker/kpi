export type AppRole =
  | "operator"
  | "line_leader"
  | "supervisor"
  | "manager"
  | "qa"
  | "maintenance"
  | "admin"
  | "management";

export type KpiStatus = "draft" | "pending" | "approved" | "rejected";

export const ROLE_LABELS: Record<AppRole, string> = {
  operator: "พนักงานผลิต (Operator)",
  line_leader: "หัวหน้าไลน์ (Line Leader)",
  supervisor: "หัวหน้างาน (Supervisor)",
  manager: "ผู้จัดการฝ่ายผลิต (Manager)",
  qa: "ฝ่ายควบคุมคุณภาพ (QA)",
  maintenance: "ฝ่ายซ่อมบำรุง (Maintenance)",
  admin: "ผู้ดูแลระบบ (Admin)",
  management: "ผู้บริหาร (Management)",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];

export const STATUS_LABELS: Record<KpiStatus, string> = {
  draft: "ร่าง",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ส่งกลับแก้ไข",
};

export const STATUS_CLASS: Record<KpiStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/15 text-warning-foreground",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

export type Permission =
  | "record_kpi"
  | "approve_kpi"
  | "view_dashboard"
  | "view_reports"
  | "export_reports"
  | "manage_master"
  | "manage_users"
  | "view_audit";

const PERMISSIONS: Record<Permission, AppRole[]> = {
  record_kpi: ["operator", "line_leader", "supervisor", "admin"],
  approve_kpi: ["supervisor", "manager", "admin"],
  view_dashboard: [
    "operator",
    "line_leader",
    "supervisor",
    "manager",
    "qa",
    "maintenance",
    "admin",
    "management",
  ],
  view_reports: [
    "operator",
    "line_leader",
    "supervisor",
    "manager",
    "qa",
    "maintenance",
    "admin",
    "management",
  ],
  export_reports: ["supervisor", "manager", "qa", "maintenance", "admin", "management"],
  manage_master: ["admin", "qa", "maintenance"],
  manage_users: ["admin"],
  view_audit: ["manager", "admin", "management"],
};

export function can(roles: AppRole[], permission: Permission): boolean {
  return roles.some((r) => PERMISSIONS[permission].includes(r));
}

/** ค่า KPI ที่คำนวณจากข้อมูลที่กรอก */
export type KpiInputs = {
  target_qty: number;
  actual_qty: number;
  good_qty: number;
  defect_qty: number;
  downtime_minutes: number;
  planned_minutes: number;
  cycle_time_sec?: number | null;
  raw_material_qty?: number | null;
};

export type KpiCalc = {
  achievement_rate: number | null;
  defect_rate: number | null;
  quality_rate: number | null;
  availability: number | null;
  performance: number | null;
  oee: number | null;
  yield_rate: number | null;
  run_minutes: number;
};

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 10000) / 100 : null);

export function calcKpi(i: KpiInputs): KpiCalc {
  const runMinutes = Math.max(i.planned_minutes - i.downtime_minutes, 0);
  const availability = pct(runMinutes, i.planned_minutes);
  const performance =
    i.cycle_time_sec && runMinutes > 0
      ? Math.round(((i.actual_qty * i.cycle_time_sec) / 60 / runMinutes) * 10000) / 100
      : null;
  const quality = pct(i.good_qty, i.actual_qty);
  const oee =
    availability != null && performance != null && quality != null
      ? Math.round(((availability * performance * quality) / 10000) * 100) / 100
      : null;
  return {
    achievement_rate: pct(i.actual_qty, i.target_qty),
    defect_rate: pct(i.defect_qty, i.actual_qty),
    quality_rate: quality,
    availability,
    performance,
    oee,
    yield_rate: i.raw_material_qty ? pct(i.good_qty, i.raw_material_qty) : null,
    run_minutes: runMinutes,
  };
}

export function fmtPct(v: number | null | undefined): string {
  return v == null ? "-" : `${Number(v).toFixed(1)}%`;
}

export function fmtNum(v: number | null | undefined): string {
  return v == null ? "-" : Number(v).toLocaleString("th-TH");
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** ส่งออกข้อมูลเป็นไฟล์ CSV (เปิดได้ด้วย Excel) */
export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
