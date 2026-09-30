import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CloudOff,
  Fingerprint,
  Link2,
  Package,
  QrCode,
  RadioTower,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Thermometer,
  Truck,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: RadioTower,
    title: "Low-cost IoT edge nodes",
    body: "Temperature, humidity, shock, tilt and door sensors sign readings on-device with secure-element keys — no gateway required.",
    tone: "text-tg-green bg-tg-green/10",
  },
  {
    icon: Link2,
    title: "Geth PoA consortium chain",
    body: "Zero-gas telemetry anchoring with ~2s finality. Every custody transfer, QA release and anchor lands on a private clique of validators.",
    tone: "text-tg-green bg-tg-green/10",
  },
  {
    icon: CloudOff,
    title: "Offline cryptographic buffering",
    body: "When cellular drops, records are Merkle-signed and flash-buffered at the edge. Sync resumes automatically — zero data loss.",
    tone: "text-tg-amber bg-tg-amber/10",
  },
  {
    icon: Fingerprint,
    title: "Biometric custody handoffs",
    body: "Face-verified handoffs bind driver identity directly into the custody smart contract — even with no cloud connectivity.",
    tone: "text-sky-400 bg-sky-400/10",
  },
  {
    icon: QrCode,
    title: "Anti-Cloning CDP labels",
    body: "QR codes embedded with microscopic cryptoglyphs defeat photocopies and reprints — failed scans raise instant counterfeit alerts.",
    tone: "text-tg-green bg-tg-green/10",
  },
  {
    icon: ShieldAlert,
    title: "Preventative spoilage alerts",
    body: "Edge analytics project excursions before they happen and push interventions to drivers — not just after-the-fact dashboards.",
    tone: "text-tg-red bg-tg-red/10",
  },
];

const stakeholderCards = [
  {
    href: "/dashboard",
    icon: Activity,
    tag: "Operations",
    title: "Your workspace",
    body: "The batches your organization monitors, the alerts that need review, and a full cold-chain record for every item.",
    stat: "Sign in required",
    accent: "border-tg-green/30 hover:border-tg-green/60",
    iconTone: "bg-tg-green/15 text-tg-green",
  },
  {
    href: "/console?next=transporter",
    icon: Smartphone,
    tag: "In the field",
    title: "Driver companion",
    body: "See how custody stays intact when cellular drops — offline buffering, preventative alerts and biometric handoffs.",
    stat: "Live field environment",
    accent: "border-tg-amber/30 hover:border-tg-amber/60",
    iconTone: "bg-tg-amber/15 text-tg-amber",
  },
  {
    href: "/console?next=consumer",
    icon: ScanLine,
    tag: "At the shelf",
    title: "Retail verification",
    body: "Watch an Anti-Cloning CDP label check expose a suspected counterfeit — and the authentic path your customers will see.",
    stat: "Live retail environment",
    accent: "border-sky-400/30 hover:border-sky-400/60",
    iconTone: "bg-sky-400/15 text-sky-400",
  },
] as const;

const chainSteps = [
  { icon: Package, title: "Origin recorded", body: "Harvest lot sealed on-chain at the packhouse", tone: "text-tg-green" },
  { icon: Truck, title: "Cold transport", body: "Edge node anchors telemetry every interval", tone: "text-tg-green" },
  { icon: Thermometer, title: "QA approval", body: "Release certificate anchored with signatures", tone: "text-tg-amber" },
  { icon: ShieldCheck, title: "Retail scan", body: "Consumer verifies cryptoglyphs + chain record", tone: "text-tg-green" },
];

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-tg-bg text-foreground"
    >
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-tg-line/50 bg-tg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="tg-glow-green flex size-9 items-center justify-center rounded-lg bg-tg-panel">
              <ShieldCheck className="size-5 text-tg-green" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">TraceGuard</p>
              <p className="text-[10px] uppercase tracking-widest text-tg-muted">
                Cold-chain integrity for enterprise supply networks
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-tg-muted md:flex">
            <a href="#capabilities" className="transition-colors hover:text-foreground">Capabilities</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#stakeholders" className="transition-colors hover:text-foreground">For your team</a>
          </nav>
          <Button asChild className="h-9 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright">
            <a href="/dashboard">
              Open workspace <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="tg-grid-bg absolute inset-0" />
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-tg-green/10 blur-[120px]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge
              variant="outline"
              className="gap-1.5 border-tg-green/30 bg-tg-green/10 px-3 py-1 text-[11px] text-tg-green"
            >
              <Wifi className="size-3" /> Farm-to-fork traceability · decentralized by design
            </Badge>
          </motion.div>          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl"
          >
            Cold-chain integrity your {" "}
            <span className="text-tg-green">partners can audit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 max-w-2xl text-pretty text-base leading-7 text-tg-muted sm:text-lg sm:leading-8"
          >
            TraceGuard gives farmers, carriers, distributors and retail partners one
            shared record of every shipment — IoT sensor telemetry anchored to a
            zero-gas Ethereum Proof-of-Authority consortium, verifiable from the
            farm to the shelf even when the network doesn't cooperate.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-12 bg-tg-green px-7 text-base font-semibold text-tg-bg hover:bg-tg-green-bright">
              <a href="/dashboard">
                Open your workspace <ArrowRight className="size-4.5" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-tg-line bg-transparent px-7 text-base text-foreground hover:bg-tg-panel-2">
              <a href="#capabilities">Explore capabilities</a>
            </Button>
          </motion.div>

          {/* Live-ish ticker strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="font-tech mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-tg-muted"
          >
            <span className="flex items-center gap-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-tg-green opacity-75" />
                <span className="relative size-1.5 rounded-full bg-tg-green" />
              </span>
              342/348 edge nodes online · consortium-wide
            </span>
            <span>block 18,442,907 · 0 gas</span>
            <span>~2s PoA finality</span>
            <span className="text-tg-green">0 excursions today</span>
          </motion.div>
        </div>
      </section>

      {/* Stakeholder cards */}
      <section id="stakeholders" className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stakeholderCards.map((c, i) => (
            <motion.a
              key={c.title}
              href={c.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <Card
                className={cn(
                  "h-full gap-4 rounded-2xl border bg-tg-panel transition-all duration-200 hover:-translate-y-1",
                  c.accent,
                )}
              >
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex size-11 items-center justify-center rounded-xl", c.iconTone)}>
                      <c.icon className="size-5" />
                    </div>
                    <ArrowRight className="size-4 text-tg-muted transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-tg-muted">
                      {c.tag}
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight">{c.title}</p>
                  </div>
                  <p className="text-sm leading-6 text-tg-muted">{c.body}</p>
                  <p className="font-tech mt-auto border-t border-tg-line/50 pt-3 text-[11px] text-tg-green">
                    {c.stat}
                  </p>
                </CardContent>
              </Card>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Capabilities grid */}
      <section id="capabilities" className="border-y border-tg-line/40 bg-tg-panel/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-tg-green">
              Capabilities
            </p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Integrity engineered at the edge
            </h2>
            <p className="mt-3 text-pretty text-sm leading-6 text-tg-muted sm:text-base sm:leading-7">
              TraceGuard assumes the worst: dead zones, dusty roads, cloned labels and
              power-hungry auditors. Every layer is built to keep the proof intact anyway.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: (i % 3) * 0.08 }}
              >
                <Card className="h-full gap-3 rounded-2xl border-tg-line/50 bg-tg-panel transition-colors hover:border-tg-line">
                  <CardContent>
                    <div className={cn("flex size-10 items-center justify-center rounded-lg", f.tone)}>
                      <f.icon className="size-5" />
                    </div>
                    <p className="mt-4 font-semibold tracking-tight">{f.title}</p>
                    <p className="mt-1.5 text-sm leading-6 text-tg-muted">{f.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="workflow" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-tg-green">
            Farm to fork
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            One unbroken chain of custody
          </h2>
        </div>
        <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-tg-green/40 to-transparent lg:block" />
          {chainSteps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="tg-glow-green flex size-12 items-center justify-center rounded-2xl border border-tg-green/30 bg-tg-panel">
                <s.icon className={cn("size-5", s.tone)} />
              </div>
              <p className="font-tech mt-3 text-[10px] uppercase tracking-widest text-tg-muted">
                step 0{i + 1}
              </p>
              <p className="mt-1 font-semibold tracking-tight">{s.title}</p>
              <p className="mt-1.5 max-w-[240px] text-sm leading-6 text-tg-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats band */}
        <div className="mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-tg-line/50 bg-tg-panel p-6 sm:grid-cols-4 sm:p-8">
          {[
            { v: "100%", k: "custody events anchored" },
            { v: "0", k: "gas fees on the consortium" },
            { v: "~2s", k: "PoA block finality" },
            { v: "-60%", k: "spoilage disputes resolved faster" },
          ].map((s) => (
            <div key={s.k} className="text-center">
              <p className="font-tech text-2xl font-bold text-tg-green sm:text-3xl">{s.v}</p>
              <p className="mt-1 text-[11px] leading-4 text-tg-muted">{s.k}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-tg-line/40 bg-tg-panel/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <div className="tg-glow-green flex size-14 items-center justify-center rounded-2xl border border-tg-green/30 bg-tg-panel">
            <ShieldCheck className="size-7 text-tg-green" />
          </div>
          <h2 className="mt-6 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Put your supply network on the chain
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-tg-muted sm:text-base">
            Create a workspace to monitor the batches your organization ships and
            receives — or explore the full operations console first, from the driver's
            cab to the retail shelf. Watch custody move end to end, from farm gate
            to shelf.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-tg-green px-8 text-base font-semibold text-tg-bg hover:bg-tg-green-bright">
              <a href="/dashboard">
                Open your workspace <ArrowRight className="size-4.5" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-tg-line bg-transparent px-8 text-base text-foreground hover:bg-tg-panel-2">
              <a href="/console">Explore the operations console</a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-tg-line/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-[11px] text-tg-muted sm:flex-row sm:px-6">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-tg-green" />
            TraceGuard — decentralized cold-chain integrity for enterprise supply networks
          </p>
          <p className="font-tech">decentralized cold-chain integrity · zero-gas PoA consortium</p>
        </div>
      </footer>
    </motion.div>
  );
}
