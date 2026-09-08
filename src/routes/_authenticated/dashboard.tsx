import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CalendarIcon, TrendingUp } from "lucide-react";
import { localDb } from "@/lib/localStorageDb";
import { AppShell } from "@/components/AppShell";
import { useMasterData, type KpiRow } from "@/hooks/useMasterData";
import { calcKpi, fmtNum, fmtPct, STATUS_CLASS, STATUS_LABELS, toISODate } from "@/lib/kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "แดชบอร์ด KPI การผลิต | Production KPI" },
      {
        name: "description",
        content: "สรุป KPI การผลิตรายวันรายกะ Achievement Rate, Quality Rate, OEE และ Downtime",
      },
      { property: "og:title", content: "แดชบอร์ด KPI การผลิต" },
      { property: "og:description", content: "ติดตาม KPI การผลิตแบบ Near Real-time" },
    ],
  }),
  component: DashboardPage,
});

const ALL = "__all__";

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function DatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {value
            ? parseISODate(value)?.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "เลือกวันที่"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parseISODate(value)}
          onSelect={(date) => date && onChange(toISODate(date))}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}
function DashboardPage() {
  const { data: master } = useMasterData();
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 13);

  const [from, setFrom] = useState(toISODate(start));
  const [to, setTo] = useState(toISODate(today));
  const [shift, setShift] = useState(ALL);
  const [line, setLine] = useState(ALL);
  const [product, setProduct] = useState(ALL);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["dashboard-kpi", from, to, shift, line, product],
    queryFn: async () => {
      const filters: { from: string; to: string; shift?: string; line?: string; product?: string } =
        {
          from,
          to,
        };
      if (shift !== ALL) filters.shift = shift;
      if (line !== ALL) filters.line = line;
      if (product !== ALL) filters.product = product;
      return localDb.getKpiRecords(filters) as KpiRow[];
    },
  });

  const { data: downtimeByReason = [] } = useQuery({
    queryKey: ["dashboard-downtime", from, to, line],
    queryFn: async () => {
      const filters: { from: string; to: string; line?: string } = { from, to };
      if (line !== ALL) filters.line = line;
      return localDb.getDowntimeByReason(filters);
    },
  });

  const { data: defectByType = [] } = useQuery({
    queryKey: ["dashboard-defects", from, to, line],
    queryFn: async () => {
      const filters: { from: string; to: string; line?: string } = { from, to };
      if (line !== ALL) filters.line = line;
      return localDb.getDefectByType(filters);
    },
  });

  const summary = useMemo(() => {
    const totals = records.reduce(
      (acc, r) => {
        acc.target += Number(r.target_qty);
        acc.actual += Number(r.actual_qty);
        acc.good += Number(r.good_qty);
        acc.defect += Number(r.defect_qty);
        acc.downtime += Number(r.downtime_minutes);
        acc.planned += Number(r.planned_minutes);
        acc.manpower += Number(r.manpower);
        acc.cycleWeighted += Number(r.cycle_time_sec ?? 0) * Number(r.actual_qty);
        acc.cycleQty += r.cycle_time_sec ? Number(r.actual_qty) : 0;
        acc.pending += r.status === "pending" ? 1 : 0;
        return acc;
      },
      {
        target: 0,
        actual: 0,
        good: 0,
        defect: 0,
        downtime: 0,
        planned: 0,
        manpower: 0,
        cycleWeighted: 0,
        cycleQty: 0,
        pending: 0,
      },
    );
    const avgCycle = totals.cycleQty > 0 ? totals.cycleWeighted / totals.cycleQty : null;
    const calc = calcKpi({
      target_qty: totals.target,
      actual_qty: totals.actual,
      good_qty: totals.good,
      defect_qty: totals.defect,
      downtime_minutes: totals.downtime,
      planned_minutes: totals.planned || 1,
      cycle_time_sec: avgCycle,
    });
    return { totals, calc, avgCycle };
  }, [records]);

  const daily = useMemo(() => {
    const map = new Map<string, { date: string; target: number; actual: number; good: number }>();
    for (const r of records) {
      const cur = map.get(r.prod_date) ?? { date: r.prod_date, target: 0, actual: 0, good: 0 };
      cur.target += Number(r.target_qty);
      cur.actual += Number(r.actual_qty);
      cur.good += Number(r.good_qty);
      map.set(r.prod_date, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" }),
        achievement: d.target > 0 ? Math.round((d.actual / d.target) * 1000) / 10 : 0,
      }));
  }, [records]);

  const byLine = useMemo(() => {
    const map = new Map<string, { name: string; actual: number; target: number; defect: number }>();
    for (const r of records) {
      const name = r.production_lines?.name ?? "ไม่ระบุ";
      const cur = map.get(name) ?? { name, actual: 0, target: 0, defect: 0 };
      cur.actual += Number(r.actual_qty);
      cur.target += Number(r.target_qty);
      cur.defect += Number(r.defect_qty);
      map.set(name, cur);
    }
    return Array.from(map.values());
  }, [records]);

  const chartColors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  return (
    <AppShell
      title="แดชบอร์ด KPI การผลิต"
      description="สรุปผลการผลิตตามช่วงวันที่ กะ ไลน์ผลิต และผลิตภัณฑ์"
    >
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-5">
          <div className="space-y-2">
            <Label>ตั้งแต่วันที่</Label>
            <DatePicker value={from} onChange={setFrom} />
          </div>
          <div className="space-y-2">
            <Label>ถึงวันที่</Label>
            <DatePicker value={to} onChange={setTo} />
          </div>
          <div className="space-y-2">
            <Label>กะ</Label>
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกกะ</SelectItem>
                {(master?.shifts ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ไลน์ผลิต</Label>
            <Select value={line} onValueChange={setLine}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกไลน์</SelectItem>
                {(master?.lines ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ผลิตภัณฑ์</Label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกผลิตภัณฑ์</SelectItem>
                {(master?.products ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Achievement Rate"
          value={fmtPct(summary.calc.achievement_rate)}
          tone="primary"
        />
        <Stat title="Quality Rate" value={fmtPct(summary.calc.quality_rate)} tone="success" />
        <Stat title="OEE" value={fmtPct(summary.calc.oee)} tone="primary" />
        <Stat title="Defect Rate" value={fmtPct(summary.calc.defect_rate)} tone="destructive" />
        <Stat title="ผลิตจริงรวม" value={fmtNum(summary.totals.actual)} />
        <Stat title="เป้าหมายรวม" value={fmtNum(summary.totals.target)} />
        <Stat
          title="Downtime รวม (นาที)"
          value={fmtNum(summary.totals.downtime)}
          tone="destructive"
        />
        <Stat title="Availability" value={fmtPct(summary.calc.availability)} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">แนวโน้มการผลิตเทียบเป้าหมาย</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
            ) : daily.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="เป้าหมาย"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="ผลิตจริง"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="good"
                    name="งานดี"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Downtime แยกตามสาเหตุ (นาที)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {downtimeByReason.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={downtimeByReason}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {downtimeByReason.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ของเสียแยกตามประเภท</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {defectByType.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" name="จำนวน" fill="var(--color-chart-4)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">ผลผลิตแยกตามไลน์ผลิต</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {byLine.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byLine}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" name="เป้าหมาย" fill="var(--color-chart-2)" radius={4} />
                  <Bar dataKey="actual" name="ผลิตจริง" fill="var(--color-chart-1)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">รายการล่าสุด (Drill-down)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="pb-2">วันที่</th>
                <th className="pb-2">กะ</th>
                <th className="pb-2">ไลน์</th>
                <th className="pb-2 text-right">เป้าหมาย</th>
                <th className="pb-2 text-right">ผลิตจริง</th>
                <th className="pb-2 text-right">Achieve</th>
                <th className="pb-2 text-right">Quality</th>
                <th className="pb-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {records
                .slice()
                .reverse()
                .slice(0, 10)
                .map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">{r.prod_date}</td>
                    <td className="py-2">{r.shifts?.code}</td>
                    <td className="py-2">{r.production_lines?.name}</td>
                    <td className="py-2 text-right">{fmtNum(r.target_qty)}</td>
                    <td className="py-2 text-right">{fmtNum(r.actual_qty)}</td>
                    <td className="py-2 text-right">{fmtPct(r.achievement_rate)}</td>
                    <td className="py-2 text-right">{fmtPct(r.quality_rate)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[r.status]}`}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {records.length === 0 && !isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              ไม่พบข้อมูลในช่วงที่เลือก
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Stat({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone?: "primary" | "success" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <AlertTriangle className="h-5 w-5" />
      <p className="text-sm">ยังไม่มีข้อมูลสำหรับตัวกรองนี้</p>
      <TrendingUp className="hidden" />
    </div>
  );
}
