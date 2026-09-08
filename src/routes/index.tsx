import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Factory,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  Gauge,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Production KPI Recording System | ระบบบันทึก KPI ฝ่ายผลิต" },
      {
        name: "description",
        content:
          "ระบบบันทึก ตรวจสอบ อนุมัติ ติดตาม และวิเคราะห์ KPI การผลิตรายวันรายกะ พร้อมแดชบอร์ด OEE รายงาน และ Audit Log ในระบบเดียว",
      },
      { property: "og:title", content: "ระบบบันทึกข้อมูล KPI ฝ่ายผลิต" },
      {
        property: "og:description",
        content:
          "ลดการใช้ Excel รวมข้อมูล KPI การผลิตไว้ที่เดียว พร้อม Workflow อนุมัติและแดชบอร์ดแบบ Near Real-time",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "บันทึก KPI รายวัน / รายกะ / รายไลน์",
    desc: "กรอก Target, Actual, Good, Defect, Downtime, Manpower พร้อม Validation ป้องกันค่าติดลบและข้อมูลไม่ครบ",
  },
  {
    icon: Gauge,
    title: "คำนวณ KPI อัตโนมัติ",
    desc: "Achievement Rate, Defect Rate, Quality Rate, Availability, Performance, OEE, Yield และ Cycle Time",
  },
  {
    icon: ShieldCheck,
    title: "Workflow ตรวจสอบและอนุมัติ",
    desc: "สถานะ ร่าง / รออนุมัติ / อนุมัติแล้ว / ส่งกลับแก้ไข พร้อมบันทึกผู้อนุมัติและเหตุผล",
  },
  {
    icon: LineChart,
    title: "แดชบอร์ดและ Drill-down",
    desc: "สรุป KPI ตามช่วงวันที่ กะ ไลน์ผลิต เครื่องจักร และผลิตภัณฑ์ พร้อมกราฟแนวโน้ม",
  },
  {
    icon: FileSpreadsheet,
    title: "รายงานและ Export",
    desc: "รายงานรายวัน รายสัปดาห์ รายเดือน ส่งออก Excel (CSV) หรือพิมพ์เป็น PDF",
  },
  {
    icon: Users,
    title: "จัดการผู้ใช้ สิทธิ์ และข้อมูลหลัก",
    desc: "8 บทบาทตาม PRD พร้อม Master Data ไลน์ผลิต เครื่องจักร กะ ผลิตภัณฑ์ ของเสีย และสาเหตุ Downtime",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <Factory className="h-6 w-6" />
            <span className="font-semibold">Production KPI</span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">เข้าสู่ระบบ</Link>
          </Button>
        </div>
      </header>

      <section className="border-b bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="mb-3 inline-block rounded-full bg-accent/25 px-3 py-1 text-xs font-medium text-accent-foreground">
            Web Application · ฝ่ายผลิต / วางแผน / QA / Maintenance / ผู้บริหาร
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            ระบบบันทึกข้อมูล KPI ฝ่ายผลิต ครบทั้งการบันทึก อนุมัติ ติดตาม และวิเคราะห์
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground md:text-lg">
            เลิกกระจายข้อมูลใน Excel หลายไฟล์ รวม KPI การผลิตไว้ในระบบกลาง คำนวณอัตโนมัติ
            ตรวจสอบย้อนหลังได้ และให้หัวหน้างานกับผู้บริหารเห็นผลการดำเนินงานได้ทันที
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">เริ่มใช้งาน</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">ดูแดชบอร์ดตัวอย่าง</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">ความสามารถหลักของระบบ</h2>
        <p className="mt-2 text-muted-foreground">ครอบคลุมขอบเขตงานทั้งหมดตามเอกสาร PRD เวอร์ชัน 1.0</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          Production KPI Recording System · เอกสารอ้างอิง PRD v1.0
        </div>
      </footer>
    </div>
  );
}
