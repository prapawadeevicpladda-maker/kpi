import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Factory, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  async function afterAuth() {
    await queryClient.invalidateQueries();
    navigate({ to: "/dashboard", replace: true });
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.object({ email: emailSchema, password: passwordSchema }).safeParse({
      email,
      password,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        toast.error("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
        return;
      }
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
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(`สมัครใช้งานไม่สำเร็จ: ${error.message}`);
      return;
    }
    if (!data.session) {
      toast.success("สมัครใช้งานสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
      return;
    }
    toast.success("สมัครใช้งานสำเร็จ");
    await afterAuth();
  }

  async function googleSignIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      return;
    }
    if (result.redirected) return;
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
              ระบบบันทึก ตรวจสอบ และอนุมัติ KPI การผลิต สำหรับฝ่ายผลิตและหน่วยงานที่เกี่ยวข้อง
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
                      placeholder="you@company.com"
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
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    เข้าสู่ระบบ
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
                    ผู้ใช้งานใหม่จะได้สิทธิ์ Operator โดยค่าเริ่มต้น
                    ผู้ดูแลระบบสามารถปรับสิทธิ์ให้ภายหลังได้ (ผู้ใช้คนแรกของระบบจะเป็น Admin)
                  </p>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    สมัครใช้งาน
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">หรือ</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={googleSignIn}
              disabled={loading}
            >
              เข้าสู่ระบบด้วย Google
            </Button>
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
