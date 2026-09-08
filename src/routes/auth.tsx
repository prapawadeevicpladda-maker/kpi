import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Factory, Loader2 } from "lucide-react";
import { z } from "zod";
import { localDb } from "@/lib/localStorageDb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ | Production KPI Recording System" },
      {
        name: "description",
        content:
          "เข้าสู่ระบบบันทึก KPI ฝ่ายผลิต เพื่อบันทึก ตรวจสอบ อนุมัติ และติดตามผลการผลิตรายวันรายกะ",
      },
      { property: "og:title", content: "เข้าสู่ระบบ | Production KPI Recording System" },
      {
        property: "og:description",
        content: "ระบบบันทึก ตรวจสอบ และอนุมัติ KPI การผลิตสำหรับฝ่ายผลิต",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }).max(255);
const passwordSchema = z.string().min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }).max(72);

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (localDb.getCurrentUser()) navigate({ to: "/dashboard", replace: true });
    else setChecking(false);
  }, [navigate]);

  async function afterAuth() {
    await queryClient.invalidateQueries();
    navigate({ to: "/dashboard", replace: true });
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({ email: emailSchema, password: passwordSchema })
      .safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = localDb.signIn(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (error) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    toast.success("เข้าสู่ระบบสำเร็จ");
    await afterAuth();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({
        email: emailSchema,
        password: passwordSchema,
        fullName: z.string().trim().min(2, { message: "กรุณากรอกชื่อ-นามสกุล" }).max(100),
      })
      .safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = localDb.signUp(parsed.data.email, parsed.data.password, parsed.data.fullName);
    setLoading(false);
    if (error) {
      toast.error(`สมัครใช้งานไม่สำเร็จ: ${error}`);
      return;
    }
    toast.success("สมัครใช้งานสำเร็จ");
    await afterAuth();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-primary">
          <Factory className="h-7 w-7" />
          <span className="text-lg font-semibold">Production KPI Recording System</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>เข้าใช้งานระบบ</CardTitle>
            <CardDescription>
              ข้อมูลบัญชีและ KPI จะถูกเก็บใน local storage ของ browser เครื่องนี้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
                <TabsTrigger value="signup">สมัครใช้งาน</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">รหัสผ่าน</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}เข้าสู่ระบบ
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">ชื่อ - นามสกุล</Label>
                    <Input
                      id="fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="สมชาย ใจดี"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">อีเมล</Label>
                    <Input
                      id="email2"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">รหัสผ่าน</Label>
                    <Input
                      id="password2"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ผู้ใช้งานใหม่จะได้สิทธิ์ Operator โดยค่าเริ่มต้น บัญชี demo: admin@example.com /
                    password
                  </p>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}สมัครใช้งาน
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline">
            กลับไปหน้าแรก
          </Link>
        </p>
      </div>
    </div>
  );
}
