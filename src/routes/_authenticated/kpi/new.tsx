import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KpiForm } from "@/components/KpiForm";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/kpi/new")({
  head: () => ({
    meta: [
      { title: "บันทึก KPI | Production KPI" },
      { name: "description", content: "บันทึกข้อมูล KPI การผลิตลง local storage" },
    ],
  }),
  component: NewKpiPage,
});

function NewKpiPage() {
  const navigate = useNavigate();

  return (
    <AppShell title="บันทึก KPI" description="กรอกข้อมูลยา เลขแบช ผลผลิต และข้อมูล KPI ฝ่ายผลิต">
      <KpiForm onSaved={() => navigate({ to: "/dashboard", replace: true })} />
    </AppShell>
  );
}
