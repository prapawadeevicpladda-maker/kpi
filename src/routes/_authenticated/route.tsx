import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { localDb } from "@/lib/localStorageDb";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = localDb.getCurrentUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
