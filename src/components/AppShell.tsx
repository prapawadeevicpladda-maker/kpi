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
import { localDb } from "@/lib/localStorageDb";
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
  { to: "/admin", label: "Admin", icon: Users, permission: "manage_users" },
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
    localDb.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="group flex h-screen w-16 flex-col transition-all duration-300 ease-in-out hover:w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 overflow-hidden border-b border-sidebar-border px-5 py-5">
        <Factory className="h-6 w-6 rounded-md bg-sidebar-primary/10 p-1 text-sidebar-primary" />
        <div className="min-w-0 whitespace-nowrap opacity-0 transition-opacity duration-200 hover:opacity-100 group-hover:opacity-100">
          <p className="text-sm font-semibold leading-tight">Production KPI</p>
          <p className="text-[11px] text-sidebar-foreground/60">ระบบบันทึก KPI ฝ่ายผลิต</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {items.map((item) => {
          const active = item.to === "/kpi" ? pathname === "/kpi" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 overflow-hidden rounded-md border-l-3 border-transparent px-3 py-3 text-sm transition-colors",
                active
                  ? "border-sidebar-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground "
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="overflow-hidden border-t border-sidebar-border p-3">
        <div className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">{email}</p>
          <p className="mt-1 text-[11px] text-sidebar-primary">
            {roles.map((r) => ROLE_LABELS[r]).join(", ") || "ยังไม่กำหนดสิทธิ์"}
          </p>
        </div>
        <button
          onClick={signOut}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60"
        >
          <LogOut className="h-4 w-4 shrink-0" />{" "}
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            ออกจากระบบ
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden md:block">{sidebar}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-50">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col md:pl-16">
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
