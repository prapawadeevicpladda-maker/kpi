import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localDb } from "@/lib/localStorageDb";
import { ROLE_LABELS } from "@/lib/kpi";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const auth = localDb.getAuthState();
    if (!auth?.roles.includes("admin")) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Admin | Production KPI" },
      { name: "description", content: "จัดการรายชื่อผู้ที่สามารถเข้าดู web app" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => localDb.listUsers(),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    await queryClient.invalidateQueries({ queryKey: ["auth-state"] });
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      localDb.addWebAppUser(fullName.trim(), email.trim(), password || "password");
      setFullName("");
      setEmail("");
      setPassword("password");
      toast.success("เพิ่มผู้ใช้งานแล้ว");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เพิ่มผู้ใช้งานไม่สำเร็จ");
    }
  }

  async function setActive(userId: string, isActive: boolean) {
    try {
      localDb.setWebAppUserActive(userId, isActive);
      toast.success(isActive ? "เปิดสิทธิ์เข้าใช้งานแล้ว" : "ปิดสิทธิ์เข้าใช้งานแล้ว");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "แก้ไขสิทธิ์ไม่สำเร็จ");
    }
  }

  async function removeUser(userId: string) {
    try {
      localDb.removeWebAppUser(userId);
      toast.success("ลบผู้ใช้งานแล้ว");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ลบผู้ใช้งานไม่สำเร็จ");
    }
  }

  return (
    <AppShell title="Admin" description="ประภาวดี เวตะนัต มีสิทธิ์จัดการรายชื่อผู้เข้าดู web app">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" /> เพิ่มผู้เข้าถึง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">ชื่อ - นามสกุล</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่านเริ่มต้น</Label>
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                เพิ่มรายชื่อ
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายชื่อผู้ที่สามารถเข้าดู web app</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="pb-2">ชื่อ</th>
                  <th className="pb-2">อีเมล</th>
                  <th className="pb-2">สิทธิ์</th>
                  <th className="pb-2">สถานะ</th>
                  <th className="pb-2 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{user.full_name}</td>
                    <td className="py-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3">
                      {user.roles.map((role) => ROLE_LABELS[role]).join(", ")}
                    </td>
                    <td className="py-3">
                      <span className={user.is_active ? "text-success" : "text-destructive"}>
                        {user.is_active ? "เข้าใช้งานได้" : "ถูกปิด"}
                      </span>
                    </td>
                    <td className="space-x-2 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActive(user.id, !user.is_active)}
                      >
                        {user.is_active ? "ปิดสิทธิ์" : "เปิดสิทธิ์"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeUser(user.id)}
                        disabled={user.id === "user-admin"}
                      >
                        <Trash2 className="h-4 w-4" /> ลบ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
