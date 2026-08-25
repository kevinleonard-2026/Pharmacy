import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Users } from "lucide-react";

export default function Admin() {
  const { user } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/auth" });
  const usersQuery = trpc.admin.users.useQuery(undefined, { enabled: user?.role === "admin" });

  if (user && user.role !== "admin") {
    return (
      <DashboardLayout requireAuth>
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
            <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Admin access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your account is signed in, but this workspace is restricted to administrators.</p>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requireAuth>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Administration</p><h1 className="text-2xl font-semibold">User access</h1></div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Review workspace accounts and their authorization roles. Role changes remain server-authorized.</p>
        </header>
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {usersQuery.isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading users…</p> : usersQuery.isError ? <p className="p-6 text-sm text-destructive">You are not authorized to view users.</p> : (
            <div className="divide-y">
              {usersQuery.data?.map((account) => <div key={account.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-medium">{account.name || "Unnamed account"}</p><p className="text-sm text-muted-foreground">{account.email || "No email provided"}</p></div><span className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide">{account.role}</span></div>)}
              {!usersQuery.data?.length && <p className="p-6 text-sm text-muted-foreground">No accounts found.</p>}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
