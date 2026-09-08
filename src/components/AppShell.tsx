import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  FilePlus2,
  CheckCircle2,
  BarChart3,
  Database,
  Users,
  ScrollText,
  LogOut,
  Menu,
  Factory,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { can, ROLE_LABELS, type Permission } from "@/lib/kpi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard, permission: "view_dashboard" },
  { to: "/kpi/new", label: "บันทึก KPI", icon: FilePlus2, permission: "record_kpi" },
  { to: "/kpi", label: "รายการ KPI", icon: ClipboardList, permission: "view_dashboard" },
  { to: "/approvals", label: "ตรวจสอบ / อนุมัติ", icon: CheckCircle2, permission: "approve_kpi" },
  { to: "/reports", label: "รายงาน", icon: BarChart3, permission: "view_reports" },
  { to: "/master", label: "ข้อมูลหลัก", icon: Database, permission: "manage_master" },
  { to: "/users", label: "ผู้ใช้งานและสิทธิ์", icon: Users, permission: "manage_users" },
  { to: "/audit", label: "ประวัติการใช้งาน", icon: ScrollText, permission: "view_audit" },
];

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { fullName, roles, email } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => can(roles, n.permission));

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <Factory className="h-6 w-6 text-sidebar-primary" />
        <div>
          <p className="text-sm font-semibold leading-tight">Production KPI</p>
          <p className="text-[11px] text-sidebar-foreground/60">ระบบบันทึก KPI ฝ่ายผลิต</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = item.to === "/kpi" ? pathname === "/kpi" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <p className="truncate text-sm font-medium">{fullName}</p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">{email}</p>
        <p className="mt-1 text-[11px] text-sidebar-primary">
          {roles.map((r) => ROLE_LABELS[r]).join(", ") || "ยังไม่กำหนดสิทธิ์"}
        </p>
        <button
          onClick={signOut}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60"
        >
          <LogOut className="h-4 w-4" /> ออกจากระบบ
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print hidden md:block">{sidebar}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-50">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex flex-wrap items-center gap-3 border-b bg-card px-4 py-4 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
