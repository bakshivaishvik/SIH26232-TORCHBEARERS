import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  Activity,
  ChevronLeft,
  LayoutDashboard,
  QrCode,
  Radio,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import logo from "@/assets/logo.svg";
import AdminView from "./AdminView";
import ConsumerView from "./ConsumerView";
import TransporterView from "./TransporterView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Stakeholder = "admin" | "transporter" | "consumer";

const meta: Record<
  Stakeholder,
  { icon: React.ComponentType<{ className?: string }>; blurb: string }
> = {
  admin: {
    icon: LayoutDashboard,
    blurb: "Desktop monitoring console — live network map, telemetry, PoA ledger",
  },
  transporter: {
    icon: Truck,
    blurb: "Driver companion — offline edge buffering, alerts, biometric custody",
  },
  consumer: {
    icon: QrCode,
    blurb: "Retail/retail scan — anti-cloning CDP check, farm-to-fork history",
  },
};

export default function OperationsConsole() {
  const [tab, setTab] = useState<Stakeholder>("admin");

  // Deep-link support: /console?view=transporter (or ?next= from the landing page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view") ?? params.get("next");
    if (v === "transporter" || v === "consumer" || v === "admin") setTab(v);
  }, []);

  return (
    <div className="min-h-screen bg-tg-bg text-foreground">
      {/* Brand bar */}
      <header className="sticky top-0 z-40 border-b border-tg-line/60 bg-tg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-tg-muted hover:bg-tg-panel-2 hover:text-foreground"
            >
              <Link to="/" aria-label="Back to TraceGuard home">
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <img src={logo} alt="TraceGuard" className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-bold tracking-tight">
                TraceGuard
                <Badge
                  variant="outline"
                  className="hidden border-tg-green/30 bg-tg-green/10 text-[9px] text-tg-green sm:inline-flex"
                >
                  LIVE CONSENSUS
                </Badge>
              </p>
              <p className="truncate text-[11px] text-tg-muted">
                Decentralized cold-chain integrity · Geth PoA consortium
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <span className="font-tech flex items-center gap-1.5 text-[11px] text-tg-muted">
              <Radio className="size-3.5 text-tg-green" /> 342/348 nodes online
            </span>
            <span className="font-tech flex items-center gap-1.5 text-[11px] text-tg-muted">
              <Activity className="size-3.5 text-tg-green" /> block 18,442,907
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-tg-line/70 text-xs text-foreground hover:bg-tg-panel-2"
            >
              <Link to="/dashboard">Your workspace</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Stakeholder tabs */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Stakeholder)}
          className="gap-5"
        >
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-tg-line/60 bg-tg-panel p-1.5">
            {(Object.keys(meta) as Stakeholder[]).map((k) => {
              const Icon = meta[k].icon;
              return (
                <TabsTrigger
                  key={k}
                  value={k}
                  className={cn(
                    "h-9 flex-1 gap-2 rounded-lg px-3 text-xs font-medium capitalize sm:text-sm",
                    "data-[state=active]:bg-tg-panel-2 data-[state=active]:shadow-none",
                    "data-[state=inactive]:text-tg-muted hover:data-[state=inactive]:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      tab === k ? "text-tg-green" : "text-tg-muted",
                    )}
                  />
                  {k === "admin" && "Supply chain console"}
                  {k === "transporter" && "Driver app"}
                  {k === "consumer" && "Consumer verify"}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 text-[11px] text-tg-muted"
          >
            {tab === "admin" && (
              <ShieldCheck className="size-3.5 shrink-0 text-tg-green" />
            )}
            {tab === "transporter" && (
              <ScanFace className="size-3.5 shrink-0 text-tg-green" />
            )}
            {tab === "consumer" && (
              <Smartphone className="size-3.5 shrink-0 text-tg-green" />
            )}
            <p>{meta[tab].blurb}</p>
          </motion.div>

          <TabsContent value="admin" className="mt-0">
            <AdminView />
          </TabsContent>
          <TabsContent value="transporter" className="mt-0">
            <TransporterView />
          </TabsContent>
          <TabsContent value="consumer" className="mt-0">
            <ConsumerView />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="mx-auto mt-10 w-full max-w-7xl px-4 pb-8 sm:px-6">
        <p className="font-tech text-center text-[10px] text-tg-muted">
          TraceGuard operations console · telemetry, shipments and ledger records are
          anchored to the consortium chain in real time
        </p>
      </footer>
    </div>
  );
}
