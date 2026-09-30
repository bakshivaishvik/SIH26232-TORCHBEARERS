import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Monitor,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  alerts,
  batches,
  statusLabel,
  type Batch,
} from "@/lib/trace-data";

/** Per-organization metrics, filtered by the signed-in account's member
 *  organization in the consortium. */
const workspace = {
  org: "Ganga Fresh Logistics",
  plan: "Consortium member",
  nodes: 6,
  activeShipments: 5,
  anchorsToday: 187,
};

const toneByStatus: Record<Batch["status"], string> = {
  "in-transit": "text-tg-green border-tg-green/30 bg-tg-green/10",
  "at-risk": "text-tg-red border-tg-red/30 bg-tg-red/10",
  delivered: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  staged: "text-tg-muted border-tg-line bg-tg-panel-2",
};

export default function WorkspaceDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const tracked = batches.slice(0, 5);
  const workspaceAlerts = alerts.slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-tg-bg text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-tg-line/60 bg-tg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="tg-glow-green flex size-8 items-center justify-center rounded-lg bg-tg-panel">
              <ShieldCheck className="size-4.5 text-tg-green" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">TraceGuard</p>
              <p className="text-[10px] uppercase tracking-widest text-tg-muted">
                {workspace.plan}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-tg-line/70 text-xs text-foreground hover:bg-tg-panel-2"
            >
              <Link to="/console">
                <Monitor className="size-3.5" /> Operations console
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 gap-1.5 text-xs text-tg-muted hover:bg-tg-panel-2 hover:text-foreground"
            >
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-tg-green">
              {workspace.org}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-1.5 text-sm text-tg-muted">
              Here is how your cold chain is performing right now.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit gap-1.5 border-tg-green/30 bg-tg-green/10 px-3 py-1 text-[11px] text-tg-green"
          >
            <ShieldCheck className="size-3.5" /> Account verified · chain access granted
          </Badge>
        </motion.div>

        {/* Summary tiles */}
        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            {
              icon: Boxes,
              label: "Batches tracked",
              value: String(tracked.length),
              sub: "2 in transit · 1 at risk",
              tone: "text-tg-green bg-tg-green/10",
            },
            {
              icon: Truck,
              label: "Active shipments",
              value: String(workspace.activeShipments),
              sub: `${workspace.nodes} edge nodes assigned`,
              tone: "text-sky-400 bg-sky-400/10",
            },
            {
              icon: CheckCircle2,
              label: "Anchors today",
              value: String(workspace.anchorsToday),
              sub: "0 gas · ~2s finality",
              tone: "text-tg-green bg-tg-green/10",
            },
            {
              icon: TriangleAlert,
              label: "Open alerts",
              value: String(workspaceAlerts.length),
              sub: "1 critical · 1 warning",
              tone: "text-tg-amber bg-tg-amber/10",
            },
          ].map((t) => (
            <Card key={t.label} className="gap-3 rounded-xl border-tg-line/60 bg-tg-panel py-4">
              <CardContent className="flex items-center gap-3 px-4">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${t.tone}`}>
                  <t.icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] uppercase tracking-wider text-tg-muted">{t.label}</p>
                  <p className="font-tech truncate text-lg font-semibold leading-tight">{t.value}</p>
                  <p className="truncate text-[11px] text-tg-muted">{t.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Your batches */}
          <Card className="border-tg-line/60 bg-tg-panel lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Thermometer className="size-4 text-tg-green" /> Your monitored batches
                </CardTitle>
                <CardDescription>
                  Select a batch to open its full cold-chain record.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {tracked.map((b) => (
                <Link
                  key={b.id}
                  to={`/dashboard/batches/${b.id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-tg-line/50 bg-tg-bg/40 p-3 transition-colors hover:border-tg-green/40 hover:bg-tg-green/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tg-panel-2">
                      <Boxes className="size-4 text-tg-muted group-hover:text-tg-green" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-tech text-xs font-semibold">
                        {b.id}{" "}
                        <span className="font-sans font-normal text-tg-muted">
                          · {b.product}
                        </span>
                      </p>
                      <p className="truncate text-[11px] text-tg-muted">
                        {b.origin} → {b.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`font-tech hidden text-xs sm:block ${
                        b.temp > 5 && b.status !== "staged" ? "text-tg-red" : "text-tg-green"
                      }`}
                    >
                      {b.temp.toFixed(1)}°C
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${toneByStatus[b.status]}`}>
                      {statusLabel[b.status]}
                    </Badge>
                    <ArrowUpRight className="size-4 shrink-0 text-tg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-tg-green" />
                  </div>
                </Link>
              ))}
              <p className="pt-1 text-center text-[11px] text-tg-muted">
                Showing {tracked.length} of {batches.length} batches registered to your organization.
              </p>
            </CardContent>
          </Card>

          {/* Right rail */}
          <div className="flex flex-col gap-6">
            {/* Alerts */}
            <Card className="border-tg-red/30 bg-tg-panel">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Alerts needing review</CardTitle>
                <Badge className="border-none bg-tg-red/15 text-tg-red">
                  {workspaceAlerts.length}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {workspaceAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-lg border p-3 ${
                      a.severity === "critical"
                        ? "border-tg-red/40 bg-tg-red/10"
                        : "border-tg-amber/30 bg-tg-amber/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-tech text-[10px] font-semibold uppercase tracking-wider ${
                          a.severity === "critical" ? "text-tg-red" : "text-tg-amber"
                        }`}
                      >
                        {a.severity}
                      </span>
                      <span className="font-tech text-[10px] text-tg-muted">{a.time}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5">{a.message}</p>
                    <p className="font-tech mt-0.5 text-[11px] text-tg-muted">
                      {a.batch} · {a.metric}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Console CTA */}
            <Card className="border-tg-line/60 bg-tg-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <LayoutDashboard className="size-4 text-tg-green" /> Full operations console
                </CardTitle>
                <CardDescription>
                  Network map, driver app and retail verification —
                  all in one place.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full gap-2 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright"
                >
                  <Link to="/console">
                    Open the console <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
