import { calcKpi, type AppRole } from "@/lib/kpi";

const DB_KEY = "production-kpi-local-db-v1";
const SESSION_KEY = "production-kpi-local-session-v1";

export type MasterRow = {
  id: string;
  code: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
};
export type Shift = MasterRow & { start_time: string; end_time: string; planned_minutes: number };
export type ProductionLine = MasterRow & { department: string };
export type Machine = MasterRow & { line_id: string | null };
export type Product = MasterRow & { unit: string; standard_cycle_time_sec: number | null };
export type DefectType = MasterRow & { category: string };
export type DowntimeReason = MasterRow & { category: string };
export type KpiStatus = "draft" | "pending" | "approved" | "rejected";
export type Profile = {
  id: string;
  full_name: string;
  email: string;
  employee_code: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
  password: string;
};
export type KpiRecord = {
  id: string;
  prod_date: string;
  medicine_name: string | null;
  batch_no: string | null;
  manufacturing_date: string | null;
  output_kgs: number | null;
  ai_percent: number | null;
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
  status: KpiStatus;
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
};
export type KpiDefect = { id: string; record_id: string; defect_type_id: string; qty: number };
export type KpiDowntime = { id: string; record_id: string; reason_id: string; minutes: number };
export type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};
export type LocalUser = { id: string; email: string };
type UserRole = { id: string; user_id: string; role: AppRole };
type LocalDb = {
  profiles: Profile[];
  user_roles: UserRole[];
  shifts: Shift[];
  production_lines: ProductionLine[];
  machines: Machine[];
  products: Product[];
  defect_types: DefectType[];
  downtime_reasons: DowntimeReason[];
  kpi_records: KpiRecord[];
  kpi_defects: KpiDefect[];
  kpi_downtimes: KpiDowntime[];
  audit_logs: AuditLog[];
};
type KpiRecordInput = Omit<
  KpiRecord,
  | "id"
  | "created_by"
  | "created_at"
  | "updated_at"
  | "approved_by"
  | "approved_at"
  | "achievement_rate"
  | "defect_rate"
  | "quality_rate"
  | "availability"
  | "yield_rate"
>;

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}
function now() {
  return new Date().toISOString();
}
function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function withMetrics(record: KpiRecord): KpiRecord {
  const metrics = calcKpi(record);
  return {
    ...record,
    achievement_rate: metrics.achievement_rate,
    defect_rate: metrics.defect_rate,
    quality_rate: metrics.quality_rate,
    availability: metrics.availability,
    yield_rate: metrics.yield_rate,
  };
}

function createDefaultProductionLines(created_at: string): ProductionLine[] {
  return [
    {
      id: "line-prod-1",
      code: "P01",
      name: "ผลิต 1",
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at,
    },
    {
      id: "line-prod-2",
      code: "P02",
      name: "ผลิต 2",
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at,
    },
    {
      id: "line-prod-3",
      code: "P03",
      name: "ผลิต 3",
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at,
    },
    {
      id: "line-prod-4",
      code: "P04",
      name: "ผลิต 4",
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at,
    },
    {
      id: "line-prod-5",
      code: "P05",
      name: "ผลิต 5",
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at,
    },
    {
      id: "line-ldi",
      code: "LDI",
      name: "ผลิต LDI",
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at,
    },
  ];
}

function ensureProductionLines(db: LocalDb): LocalDb {
  const requiredLines = createDefaultProductionLines(now());
  const shouldReplace = !requiredLines.every((line) =>
    db.production_lines.some((existing) => existing.name === line.name),
  );
  if (!shouldReplace) return db;

  const oldLineIds = db.production_lines.map((line) => line.id);
  db.production_lines = requiredLines;
  db.machines = db.machines.map((machine, index) => ({
    ...machine,
    line_id: requiredLines[index % requiredLines.length]!.id,
  }));
  db.kpi_records = db.kpi_records.map((record, index) => {
    const shouldRemap = !record.line_id || oldLineIds.includes(record.line_id);
    return shouldRemap
      ? { ...record, line_id: requiredLines[index % requiredLines.length]!.id }
      : record;
  });
  return db;
}
function seedDb(): LocalDb {
  const created_at = now();
  const shifts: Shift[] = [
    {
      id: "shift-a",
      code: "A",
      name: "กะเช้า (A)",
      start_time: "08:00",
      end_time: "16:00",
      planned_minutes: 480,
      is_active: true,
      created_at,
    },
    {
      id: "shift-b",
      code: "B",
      name: "กะบ่าย (B)",
      start_time: "16:00",
      end_time: "00:00",
      planned_minutes: 480,
      is_active: true,
      created_at,
    },
    {
      id: "shift-c",
      code: "C",
      name: "กะกลางคืน (C)",
      start_time: "00:00",
      end_time: "08:00",
      planned_minutes: 480,
      is_active: true,
      created_at,
    },
  ];
  const production_lines: ProductionLine[] = createDefaultProductionLines(created_at);
  const machines: Machine[] = [
    {
      id: "machine-m01",
      code: "M01",
      name: "เครื่องฉีดพลาสติก A",
      line_id: "line-l01",
      is_active: true,
      created_at,
    },
    {
      id: "machine-m02",
      code: "M02",
      name: "เครื่องประกอบอัตโนมัติ B",
      line_id: "line-l02",
      is_active: true,
      created_at,
    },
    {
      id: "machine-m03",
      code: "M03",
      name: "เครื่องบรรจุ C",
      line_id: "line-l03",
      is_active: true,
      created_at,
    },
  ];
  const products: Product[] = [
    {
      id: "product-p001",
      code: "P001",
      name: "ชิ้นส่วนฝาครอบ",
      unit: "ชิ้น",
      standard_cycle_time_sec: 30,
      is_active: true,
      created_at,
    },
    {
      id: "product-p002",
      code: "P002",
      name: "ชุดประกอบมอเตอร์",
      unit: "ชุด",
      standard_cycle_time_sec: 45,
      is_active: true,
      created_at,
    },
    {
      id: "product-p003",
      code: "P003",
      name: "กล่องบรรจุสำเร็จ",
      unit: "กล่อง",
      standard_cycle_time_sec: 20,
      is_active: true,
      created_at,
    },
  ];
  const defect_types: DefectType[] = [
    {
      id: "defect-d01",
      code: "D01",
      name: "ผิวงานเป็นรอย",
      category: "คุณภาพผิว",
      is_active: true,
      created_at,
    },
    {
      id: "defect-d02",
      code: "D02",
      name: "ขนาดไม่ได้มาตรฐาน",
      category: "มิติ",
      is_active: true,
      created_at,
    },
    {
      id: "defect-d03",
      code: "D03",
      name: "ประกอบไม่แน่น",
      category: "การประกอบ",
      is_active: true,
      created_at,
    },
    {
      id: "defect-d04",
      code: "D04",
      name: "ปนเปื้อน/สกปรก",
      category: "ความสะอาด",
      is_active: true,
      created_at,
    },
  ];
  const downtime_reasons: DowntimeReason[] = [
    {
      id: "downtime-dt01",
      code: "DT01",
      name: "เครื่องจักรเสีย",
      category: "Breakdown",
      is_active: true,
      created_at,
    },
    {
      id: "downtime-dt02",
      code: "DT02",
      name: "เปลี่ยนรุ่นการผลิต",
      category: "Changeover",
      is_active: true,
      created_at,
    },
    {
      id: "downtime-dt03",
      code: "DT03",
      name: "ขาดวัตถุดิบ",
      category: "Material",
      is_active: true,
      created_at,
    },
    {
      id: "downtime-dt04",
      code: "DT04",
      name: "บำรุงรักษาตามแผน",
      category: "Planned Maintenance",
      is_active: true,
      created_at,
    },
    {
      id: "downtime-dt05",
      code: "DT05",
      name: "รอคำสั่งผลิต",
      category: "Waiting",
      is_active: true,
      created_at,
    },
  ];
  const admin: Profile = {
    id: "user-admin",
    full_name: "ประภาวดี เวตะนัต",
    email: "admin@example.com",
    employee_code: null,
    department: "ฝ่ายผลิต",
    is_active: true,
    created_at,
    password: "password",
  };
  const statuses: KpiStatus[] = ["approved", "approved", "approved", "pending", "draft"];
  const kpi_records = Array.from({ length: 45 }, (_, index) => {
    const g = index + 1;
    const lineIndex = g % 3;
    const prod_date = daysAgo(g % 14);
    return withMetrics({
      id: `record-${g}`,
      prod_date,
      medicine_name: products[lineIndex]!.name,
      batch_no: `BATCH-${String(g).padStart(3, "0")}`,
      manufacturing_date: prod_date,
      output_kgs: Math.round((880 + ((g * 7) % 140)) * 0.25 * 100) / 100,
      ai_percent: Math.round((95 + (g % 5) * 0.4) * 100) / 100,
      shift_id: shifts[g % 3]!.id,
      line_id: production_lines[lineIndex]!.id,
      machine_id: machines[lineIndex]!.id,
      product_id: products[lineIndex]!.id,
      work_order: `WO-${prod_date.replaceAll("-", "")}-${String(g).padStart(2, "0")}`,
      planned_minutes: 480,
      target_qty: 1000,
      actual_qty: 880 + ((g * 7) % 140),
      good_qty: 830 + ((g * 5) % 120),
      defect_qty: 20 + ((g * 3) % 40),
      scrap_qty: 5 + (g % 10),
      rework_qty: 3 + (g % 8),
      raw_material_qty: 1000 + (g % 50),
      downtime_minutes: 15 + ((g * 4) % 60),
      manpower: 8 + (g % 4),
      cycle_time_sec: 30,
      remark: g % 5 === 0 ? "เครื่องจักรหยุดระหว่างกะ" : null,
      status: statuses[g % 5]!,
      created_by: admin.id,
      created_at,
      updated_at: created_at,
      submitted_at: created_at,
      approved_by: g % 5 < 3 ? admin.id : null,
      approved_at: g % 5 < 3 ? created_at : null,
      reject_reason: null,
      achievement_rate: null,
      defect_rate: null,
      quality_rate: null,
      availability: null,
      yield_rate: null,
    });
  });
  return {
    profiles: [admin],
    user_roles: [{ id: "role-admin", user_id: admin.id, role: "admin" }],
    shifts,
    production_lines,
    machines,
    products,
    defect_types,
    downtime_reasons,
    kpi_records,
    kpi_defects: kpi_records.map((record, index) => ({
      id: `kpi-defect-${record.id}`,
      record_id: record.id,
      defect_type_id: defect_types[index % defect_types.length]!.id,
      qty: record.defect_qty,
    })),
    kpi_downtimes: kpi_records.map((record, index) => ({
      id: `kpi-downtime-${record.id}`,
      record_id: record.id,
      reason_id: downtime_reasons[index % downtime_reasons.length]!.id,
      minutes: record.downtime_minutes,
    })),
    audit_logs: [],
  };
}

function ensureAdminProfile(db: LocalDb): LocalDb {
  let admin = db.profiles.find((profile) => profile.id === "user-admin");
  if (!admin) {
    admin = {
      id: "user-admin",
      full_name: "ประภาวดี เวตะนัต",
      email: "admin@example.com",
      employee_code: null,
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at: now(),
      password: "password",
    };
    db.profiles.unshift(admin);
  } else {
    admin.full_name = "ประภาวดี เวตะนัต";
    admin.is_active = true;
  }
  if (!db.user_roles.some((role) => role.user_id === admin.id && role.role === "admin")) {
    db.user_roles.push({ id: id("role"), user_id: admin.id, role: "admin" });
  }
  return db;
}
function ensureMedicineFields(db: LocalDb): LocalDb {
  db.kpi_records = db.kpi_records.map((record) => ({
    ...record,
    medicine_name: record.medicine_name ?? null,
    batch_no: record.batch_no ?? null,
    manufacturing_date: record.manufacturing_date ?? record.prod_date,
    output_kgs: record.output_kgs ?? null,
    ai_percent: record.ai_percent ?? null,
  }));
  return db;
}
function readDb(): LocalDb {
  const store = storage();
  if (!store) return seedDb();
  const raw = store.getItem(DB_KEY);
  if (raw) {
    const db = ensureAdminProfile(
      ensureMedicineFields(ensureProductionLines(JSON.parse(raw) as LocalDb)),
    );
    store.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
  const db = seedDb();
  store.setItem(DB_KEY, JSON.stringify(db));
  return db;
}
function writeDb(db: LocalDb) {
  storage()?.setItem(DB_KEY, JSON.stringify(db));
}

export const localDb = {
  getCurrentUser(): LocalUser | null {
    const userId = storage()?.getItem(SESSION_KEY);
    if (!userId) return null;
    const profile = readDb().profiles.find((item) => item.id === userId && item.is_active);
    return profile ? { id: profile.id, email: profile.email } : null;
  },
  signIn(email: string, password: string): { user: LocalUser | null; error: string | null } {
    const profile = readDb().profiles.find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
    );
    if (!profile || !profile.is_active) return { user: null, error: "Invalid login credentials" };
    storage()?.setItem(SESSION_KEY, profile.id);
    return { user: { id: profile.id, email: profile.email }, error: null };
  },
  signUp(
    email: string,
    password: string,
    fullName: string,
  ): { user: LocalUser | null; error: string | null } {
    const db = readDb();
    if (db.profiles.some((item) => item.email.toLowerCase() === email.toLowerCase()))
      return { user: null, error: "อีเมลนี้ถูกใช้งานแล้ว" };
    const profile: Profile = {
      id: id("user"),
      full_name: fullName,
      email,
      employee_code: null,
      department: "ฝ่ายผลิต",
      is_active: true,
      created_at: now(),
      password,
    };
    db.profiles.push(profile);
    db.user_roles.push({
      id: id("role"),
      user_id: profile.id,
      role: db.profiles.length === 1 ? "admin" : "operator",
    });
    writeDb(db);
    storage()?.setItem(SESSION_KEY, profile.id);
    return { user: { id: profile.id, email }, error: null };
  },
  signOut() {
    storage()?.removeItem(SESSION_KEY);
  },
  getAuthState() {
    const user = this.getCurrentUser();
    if (!user) return null;
    const db = readDb();
    const profile = db.profiles.find((item) => item.id === user.id);
    if (!profile) return null;
    return {
      userId: profile.id,
      email: profile.email,
      fullName: profile.full_name || profile.email || "ผู้ใช้งาน",
      isActive: profile.is_active,
      roles: db.user_roles.filter((item) => item.user_id === profile.id).map((item) => item.role),
    };
  },
  getMasterData() {
    const db = readDb();
    return {
      shifts: db.shifts,
      lines: db.production_lines,
      machines: db.machines,
      products: db.products,
      defectTypes: db.defect_types,
      downtimeReasons: db.downtime_reasons,
    };
  },
  getKpiRecords(filters?: {
    from?: string;
    to?: string;
    shift?: string;
    line?: string;
    product?: string;
  }) {
    const db = readDb();
    return db.kpi_records
      .filter((record) => !filters?.from || record.prod_date >= filters.from)
      .filter((record) => !filters?.to || record.prod_date <= filters.to)
      .filter((record) => !filters?.shift || record.shift_id === filters.shift)
      .filter((record) => !filters?.line || record.line_id === filters.line)
      .filter((record) => !filters?.product || record.product_id === filters.product)
      .sort((a, b) => a.prod_date.localeCompare(b.prod_date))
      .map((record) => ({
        ...record,
        shifts: db.shifts.find((item) => item.id === record.shift_id) ?? null,
        production_lines: db.production_lines.find((item) => item.id === record.line_id) ?? null,
        machines: db.machines.find((item) => item.id === record.machine_id) ?? null,
        products: db.products.find((item) => item.id === record.product_id) ?? null,
      }));
  },
  getDowntimeByReason(filters?: { from?: string; to?: string; line?: string }) {
    const db = readDb();
    const records = this.getKpiRecords(filters);
    const recordIds = new Set(records.map((record) => record.id));
    const totals = new Map<string, number>();
    for (const row of db.kpi_downtimes.filter((item) => recordIds.has(item.record_id))) {
      const name = db.downtime_reasons.find((item) => item.id === row.reason_id)?.name ?? "ไม่ระบุ";
      totals.set(name, (totals.get(name) ?? 0) + Number(row.minutes));
    }
    return Array.from(totals, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  },
  getDefectByType(filters?: { from?: string; to?: string; line?: string }) {
    const db = readDb();
    const records = this.getKpiRecords(filters);
    const recordIds = new Set(records.map((record) => record.id));
    const totals = new Map<string, number>();
    for (const row of db.kpi_defects.filter((item) => recordIds.has(item.record_id))) {
      const name =
        db.defect_types.find((item) => item.id === row.defect_type_id)?.name ?? "ไม่ระบุ";
      totals.set(name, (totals.get(name) ?? 0) + Number(row.qty));
    }
    return Array.from(totals, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  },
  saveKpiRecord(
    recordId: string | null,
    payload: KpiRecordInput,
    userId: string | null,
    defects: Omit<KpiDefect, "id" | "record_id">[],
    downtimes: Omit<KpiDowntime, "id" | "record_id">[],
  ) {
    const db = readDb();
    const timestamp = now();
    let idToSave = recordId;
    if (idToSave) {
      const index = db.kpi_records.findIndex((record) => record.id === idToSave);
      if (index < 0) throw new Error("ไม่พบรายการ KPI");
      db.kpi_records[index] = withMetrics({
        ...db.kpi_records[index]!,
        ...payload,
        updated_at: timestamp,
      });
    } else {
      idToSave = id("record");
      db.kpi_records.push(
        withMetrics({
          ...payload,
          id: idToSave,
          created_by: userId,
          created_at: timestamp,
          updated_at: timestamp,
          approved_by: null,
          approved_at: null,
          achievement_rate: null,
          defect_rate: null,
          quality_rate: null,
          availability: null,
          yield_rate: null,
        }),
      );
    }
    db.kpi_defects = db.kpi_defects.filter((row) => row.record_id !== idToSave);
    db.kpi_downtimes = db.kpi_downtimes.filter((row) => row.record_id !== idToSave);
    db.kpi_defects.push(
      ...defects.map((row) => ({ ...row, id: id("defect"), record_id: idToSave! })),
    );
    db.kpi_downtimes.push(
      ...downtimes.map((row) => ({ ...row, id: id("downtime"), record_id: idToSave! })),
    );
    writeDb(db);
    return idToSave;
  },
  addAudit(
    action: string,
    entity: string,
    entityId?: string | null,
    detail?: Record<string, unknown>,
  ) {
    const user = this.getCurrentUser();
    if (!user) return;
    const db = readDb();
    db.audit_logs.push({
      id: id("audit"),
      user_id: user.id,
      action,
      entity,
      entity_id: entityId ?? null,
      detail: detail ?? null,
      created_at: now(),
    });
    writeDb(db);
  },
  listUsers() {
    const db = readDb();
    return db.profiles.map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      is_active: profile.is_active,
      roles: db.user_roles.filter((role) => role.user_id === profile.id).map((role) => role.role),
      created_at: profile.created_at,
    }));
  },
  addWebAppUser(fullName: string, email: string, password: string, role: AppRole = "operator") {
    const db = readDb();
    if (db.profiles.some((profile) => profile.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("อีเมลนี้มีอยู่แล้ว");
    }
    const profile: Profile = {
      id: id("user"),
      full_name: fullName,
      email,
      employee_code: null,
      department: null,
      is_active: true,
      created_at: now(),
      password,
    };
    db.profiles.push(profile);
    db.user_roles.push({ id: id("role"), user_id: profile.id, role });
    writeDb(db);
    return profile.id;
  },
  removeWebAppUser(userId: string) {
    if (userId === "user-admin") throw new Error("ไม่สามารถลบ Admin หลักได้");
    const db = readDb();
    db.profiles = db.profiles.filter((profile) => profile.id !== userId);
    db.user_roles = db.user_roles.filter((role) => role.user_id !== userId);
    db.audit_logs = db.audit_logs.filter((log) => log.user_id !== userId);
    writeDb(db);
  },
  setWebAppUserActive(userId: string, isActive: boolean) {
    if (userId === "user-admin" && !isActive) throw new Error("ไม่สามารถปิดใช้งาน Admin หลักได้");
    const db = readDb();
    const profile = db.profiles.find((item) => item.id === userId);
    if (!profile) throw new Error("ไม่พบผู้ใช้งาน");
    profile.is_active = isActive;
    writeDb(db);
  },
  getUserNames(ids: (string | null)[]) {
    const unique = Array.from(new Set(ids.filter((value): value is string => !!value)));
    const db = readDb();
    return Object.fromEntries(
      unique.map((userId) => [
        userId,
        db.profiles.find((profile) => profile.id === userId)?.full_name || "-",
      ]),
    );
  },
};
