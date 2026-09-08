import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMasterData, type KpiRow } from "@/hooks/useMasterData";
import { logAudit } from "@/hooks/useAuth";
import { calcKpi, fmtPct, toISODate } from "@/lib/kpi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Breakdown = { id?: string; key: string; qty: string };

const NONE = "__none__";

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function KpiForm({
  initial,
  onSaved,
  initialDefects,
  initialDowntimes,
}: {
  initial?: KpiRow;
  initialDefects?: { id: string; defect_type_id: string; qty: number }[];
  initialDowntimes?: { id: string; reason_id: string; minutes: number }[];
  onSaved: (recordId: string) => void;
}) {
  const { data: master, isLoading } = useMasterData();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    prod_date: initial?.prod_date ?? toISODate(new Date()),
    shift_id: initial?.shift_id ?? "",
    line_id: initial?.line_id ?? "",
    machine_id: initial?.machine_id ?? "",
    product_id: initial?.product_id ?? "",
    work_order: initial?.work_order ?? "",
    planned_minutes: String(initial?.planned_minutes ?? 480),
    target_qty: String(initial?.target_qty ?? ""),
    actual_qty: String(initial?.actual_qty ?? ""),
    good_qty: String(initial?.good_qty ?? ""),
    defect_qty: String(initial?.defect_qty ?? ""),
    scrap_qty: String(initial?.scrap_qty ?? 0),
    rework_qty: String(initial?.rework_qty ?? 0),
    raw_material_qty: initial?.raw_material_qty != null ? String(initial.raw_material_qty) : "",
    downtime_minutes: String(initial?.downtime_minutes ?? 0),
    manpower: String(initial?.manpower ?? ""),
    cycle_time_sec: initial?.cycle_time_sec != null ? String(initial.cycle_time_sec) : "",
    remark: initial?.remark ?? "",
  });

  const [defects, setDefects] = useState<Breakdown[]>(
    (initialDefects ?? []).map((d) => ({ id: d.id, key: d.defect_type_id, qty: String(d.qty) })),
  );
  const [downtimes, setDowntimes] = useState<Breakdown[]>(
    (initialDowntimes ?? []).map((d) => ({ id: d.id, key: d.reason_id, qty: String(d.minutes) })),
  );

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const calc = useMemo(
    () =>
      calcKpi({
        target_qty: num(form.target_qty),
        actual_qty: num(form.actual_qty),
        good_qty: num(form.good_qty),
        defect_qty: num(form.defect_qty),
        downtime_minutes: num(form.downtime_minutes),
        planned_minutes: num(form.planned_minutes),
        cycle_time_sec: form.cycle_time_sec ? num(form.cycle_time_sec) : null,
        raw_material_qty: form.raw_material_qty ? num(form.raw_material_qty) : null,
      }),
    [form],
  );

  function validate(): string | null {
    if (!form.prod_date) return "กรุณาเลือกวันที่ผลิต";
    if (!form.shift_id) return "กรุณาเลือกกะการทำงาน";
    if (!form.line_id) return "กรุณาเลือกไลน์ผลิต";
    if (num(form.planned_minutes) <= 0) return "เวลาผลิตตามแผนต้องมากกว่า 0 นาที";
    const nonNeg: [string, string][] = [
      ["target_qty", "เป้าหมายการผลิต"],
      ["actual_qty", "จำนวนผลิตจริง"],
      ["good_qty", "จำนวนงานดี"],
      ["defect_qty", "จำนวนของเสีย"],
      ["scrap_qty", "Scrap"],
      ["rework_qty", "Rework"],
      ["downtime_minutes", "Downtime"],
      ["manpower", "จำนวนพนักงาน"],
    ];
    for (const [key, label] of nonNeg) {
      const raw = form[key as keyof typeof form];
      if (raw === "") return `กรุณากรอก${label}`;
      if (num(raw) < 0) return `${label} ต้องไม่เป็นค่าติดลบ`;
    }
    if (num(form.good_qty) + num(form.defect_qty) > num(form.actual_qty))
      return "จำนวนงานดี + ของเสีย ต้องไม่มากกว่าจำนวนผลิตจริง";
    if (num(form.downtime_minutes) > num(form.planned_minutes))
      return "Downtime ต้องไม่มากกว่าเวลาผลิตตามแผน";
    const dSum = defects.reduce((s, d) => s + num(d.qty), 0);
    if (defects.length > 0 && dSum > num(form.defect_qty))
      return "ผลรวมของเสียแยกตามประเภท ต้องไม่มากกว่าจำนวนของเสียรวม";
    const tSum = downtimes.reduce((s, d) => s + num(d.qty), 0);
    if (downtimes.length > 0 && tSum > num(form.downtime_minutes))
      return "ผลรวม Downtime แยกตามสาเหตุ ต้องไม่มากกว่า Downtime รวม";
    return null;
  }

  async function save(action: "draft" | "submit") {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      prod_date: form.prod_date,
      shift_id: form.shift_id,
      line_id: form.line_id,
      machine_id: form.machine_id || null,
      product_id: form.product_id || null,
      work_order: form.work_order.trim() || null,
      planned_minutes: num(form.planned_minutes),
      target_qty: num(form.target_qty),
      actual_qty: num(form.actual_qty),
      good_qty: num(form.good_qty),
      defect_qty: num(form.defect_qty),
      scrap_qty: num(form.scrap_qty),
      rework_qty: num(form.rework_qty),
      raw_material_qty: form.raw_material_qty ? num(form.raw_material_qty) : null,
      downtime_minutes: num(form.downtime_minutes),
      manpower: num(form.manpower),
      cycle_time_sec: form.cycle_time_sec ? num(form.cycle_time_sec) : null,
      remark: form.remark.trim() || null,
      status: action === "submit" ? ("pending" as const) : ("draft" as const),
      submitted_at: action === "submit" ? new Date().toISOString() : null,
      reject_reason: null,
    };

    let recordId = initial?.id ?? "";
    if (initial) {
      const { error } = await supabase.from("kpi_records").update(payload).eq("id", initial.id);
      if (error) {
        setSaving(false);
        toast.error(`บันทึกไม่สำเร็จ: ${error.message}`);
        return;
      }
      await supabase.from("kpi_defects").delete().eq("record_id", initial.id);
      await supabase.from("kpi_downtimes").delete().eq("record_id", initial.id);
    } else {
      const { data, error } = await supabase
        .from("kpi_records")
        .insert({ ...payload, created_by: userData.user?.id ?? null })
        .select("id")
        .single();
      if (error || !data) {
        setSaving(false);
        toast.error(`บันทึกไม่สำเร็จ: ${error?.message ?? "ไม่ทราบสาเหตุ"}`);
        return;
      }
      recordId = data.id;
    }

    const dRows = defects
      .filter((d) => d.key && num(d.qty) > 0)
      .map((d) => ({ record_id: recordId, defect_type_id: d.key, qty: num(d.qty) }));
    if (dRows.length) await supabase.from("kpi_defects").insert(dRows);
    const tRows = downtimes
      .filter((d) => d.key && num(d.qty) > 0)
      .map((d) => ({ record_id: recordId, reason_id: d.key, minutes: num(d.qty) }));
    if (tRows.length) await supabase.from("kpi_downtimes").insert(tRows);

    await logAudit(
      initial ? (action === "submit" ? "ส่งอนุมัติ" : "แก้ไขข้อมูล") : "บันทึกข้อมูลใหม่",
      "kpi_records",
      recordId,
      { status: payload.status, prod_date: payload.prod_date },
    );

    setSaving(false);
    toast.success(action === "submit" ? "ส่งข้อมูลเพื่อขออนุมัติแล้ว" : "บันทึกร่างเรียบร้อย");
    onSaved(recordId);
  }

  if (isLoading || !master) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดข้อมูลหลัก...
      </div>
    );
  }

  const machinesForLine = master.machines.filter(
    (m) => !form.line_id || !m.line_id || m.line_id === form.line_id,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลการผลิต</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prod_date">วันที่ผลิต *</Label>
              <Input
                id="prod_date"
                type="date"
                value={form.prod_date}
                onChange={(e) => set("prod_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>กะการทำงาน *</Label>
              <Select
                value={form.shift_id}
                onValueChange={(v) => {
                  set("shift_id", v);
                  const s = master.shifts.find((x) => x.id === v);
                  if (s) set("planned_minutes", String(s.planned_minutes));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกกะ" />
                </SelectTrigger>
                <SelectContent>
                  {master.shifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ไลน์ผลิต *</Label>
              <Select value={form.line_id} onValueChange={(v) => set("line_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกไลน์ผลิต" />
                </SelectTrigger>
                <SelectContent>
                  {master.lines.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} · {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>เครื่องจักร</Label>
              <Select
                value={form.machine_id || NONE}
                onValueChange={(v) => set("machine_id", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ไม่ระบุ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                  {machinesForLine.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} · {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ผลิตภัณฑ์</Label>
              <Select
                value={form.product_id || NONE}
                onValueChange={(v) => {
                  const id = v === NONE ? "" : v;
                  set("product_id", id);
                  const p = master.products.find((x) => x.id === id);
                  if (p?.standard_cycle_time_sec)
                    set("cycle_time_sec", String(p.standard_cycle_time_sec));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ไม่ระบุ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                  {master.products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wo">Work Order</Label>
              <Input
                id="wo"
                value={form.work_order}
                onChange={(e) => set("work_order", e.target.value)}
                maxLength={50}
                placeholder="เช่น WO-20260908-01"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูล KPI</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {(
              [
                ["planned_minutes", "เวลาผลิตตามแผน (นาที) *"],
                ["target_qty", "เป้าหมายการผลิต *"],
                ["actual_qty", "จำนวนผลิตจริง *"],
                ["good_qty", "จำนวนงานดี *"],
                ["defect_qty", "จำนวนของเสีย *"],
                ["scrap_qty", "Scrap"],
                ["rework_qty", "Rework"],
                ["raw_material_qty", "วัตถุดิบที่ใช้ (สำหรับ Yield)"],
                ["downtime_minutes", "Downtime (นาที) *"],
                ["manpower", "จำนวนพนักงาน (คน) *"],
                ["cycle_time_sec", "Cycle Time มาตรฐาน (วินาที/ชิ้น)"],
              ] as [keyof typeof form, string][]
            ).map(([key, label]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min={0}
                  step="any"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="remark">หมายเหตุ</Label>
              <Textarea
                id="remark"
                value={form.remark}
                onChange={(e) => set("remark", e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <BreakdownCard
          title="ของเสียแยกตามประเภท"
          unitLabel="จำนวน"
          options={master.defectTypes}
          rows={defects}
          setRows={setDefects}
        />
        <BreakdownCard
          title="Downtime แยกตามสาเหตุ"
          unitLabel="นาที"
          options={master.downtimeReasons}
          rows={downtimes}
          setRows={setDowntimes}
        />
      </div>

      <div className="space-y-4">
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">KPI ที่คำนวณอัตโนมัติ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Achievement Rate", fmtPct(calc.achievement_rate)],
              ["Quality Rate", fmtPct(calc.quality_rate)],
              ["Defect Rate", fmtPct(calc.defect_rate)],
              ["Availability", fmtPct(calc.availability)],
              ["Performance", fmtPct(calc.performance)],
              ["OEE", fmtPct(calc.oee)],
              ["Yield", fmtPct(calc.yield_rate)],
              ["เวลาเดินเครื่อง (นาที)", String(calc.run_minutes)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b pb-2 last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            <div className="space-y-2 pt-3">
              <Button className="w-full" onClick={() => save("submit")} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ส่งขออนุมัติ
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => save("draft")}
                disabled={saving}
              >
                บันทึกเป็นร่าง
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  unitLabel,
  options,
  rows,
  setRows,
}: {
  title: string;
  unitLabel: string;
  options: { id: string; code: string; name: string }[];
  rows: Breakdown[];
  setRows: (r: Breakdown[]) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setRows([...rows, { key: "", qty: "" }])}
        >
          <Plus className="mr-1 h-4 w-4" /> เพิ่มรายการ
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>}
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">รายการ</Label>
              <Select
                value={row.key}
                onValueChange={(v) =>
                  setRows(rows.map((r, i) => (i === idx ? { ...r, key: v } : r)))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือก" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.code} · {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs">{unitLabel}</Label>
              <Input
                type="number"
                min={0}
                value={row.qty}
                onChange={(e) =>
                  setRows(rows.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))
                }
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setRows(rows.filter((_, i) => i !== idx))}
              aria-label="ลบรายการ"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
