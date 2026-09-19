"use client"

import * as React from "react"
import Link from "next/link"
import {
  RotateCcw,
  Play,
  FastForward,
  Mountain,
  AlertTriangle,
  CloudLightning,
  WifiOff,
  Wifi,
  LifeBuoy,
  ExternalLink,
  Share2,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react"
import { demoDriver } from "@/lib/demo/driver"
import { useConnectivity } from "@/lib/offline/status"
import { subscribeOutboxStatus } from "@/lib/outbox"
import { sessionStore } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { Status } from "@/components/ui/status"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

type StepId = "start" | "fastForward" | "lobuche" | "checkin" | "storm" | "sos" | "flush"

interface Step {
  id: StepId
  title: string
  detail: string
  icon: React.ReactNode
  run: () => Promise<string>
}

export default function DemoPage() {
  const isDemoEnv = process.env.NEXT_PUBLIC_DEMO === "1"
  const { online, forcedOffline } = useConnectivity()
  const session = sessionStore.useValue()
  const [ataxia, setAtaxia] = React.useState(false)
  const [pending, setPending] = React.useState(0)
  const [running, setRunning] = React.useState<StepId | "reset" | null>(null)
  const [done, setDone] = React.useState<Set<StepId>>(new Set())
  const [log, setLog] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => subscribeOutboxStatus((s) => setPending(s.pending)), [])

  const addLog = (msg: string) => {
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", timeStyle: "medium" }).format(new Date())
    setLog((prev) => [`${time}  ${msg}`, ...prev.slice(0, 29)])
  }

  const exec = async (id: StepId | "reset", run: () => Promise<string>) => {
    setRunning(id)
    try {
      addLog(await run())
      setDone((prev) => (id === "reset" ? new Set() : new Set(prev).add(id)))
    } catch (e) {
      addLog(`✖ ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setRunning(null)
    }
  }

  const shareToken = session?.trek?.shareToken ?? null
  const steps: Step[] = [
    { id: "start", title: "Start EBC trek", detail: "Active trek that began 6 days ago, so today is day 7. Creates the family share link.", icon: <Play className="size-4" />, run: demoDriver.startEbcTrek },
    { id: "fastForward", title: "Days 1–6 to Dingboche", detail: "Lukla → Phakding → Namche (rest) → Tengboche → Dingboche (rest). All check-ins green.", icon: <FastForward className="size-4" />, run: demoDriver.fastForwardDingboche },
    { id: "lobuche", title: "Day 7 to Lobuche", detail: "Sleeps at 4,940 m (+530 m). The AMS engine raises the gain caution.", icon: <Mountain className="size-4" />, run: demoDriver.advanceToLobuche },
    { id: "checkin", title: "Symptom check-in", detail: "LLS 7 (headache 2, GI 2, fatigue 2, dizziness 1). Engine verdict: warning, or danger with ataxia.", icon: <AlertTriangle className="size-4" />, run: () => demoDriver.submitBadCheckin(ataxia) },
    { id: "storm", title: "Weather turns", detail: "Storm fixture for Gorak Shep; the weather engine returns no-go.", icon: <CloudLightning className="size-4" />, run: demoDriver.injectStormWeather },
    { id: "sos", title: "SOS at Lobuche", detail: "Altitude illness. Delivered live, or queued with the SMS panel when offline.", icon: <LifeBuoy className="size-4" />, run: demoDriver.triggerSos },
    { id: "flush", title: "Back online", detail: "Clears simulated offline and flushes the outbox to coordination.", icon: <Wifi className="size-4" />, run: () => demoDriver.backOnlineAndFlush() },
  ]

  if (!isDemoEnv) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 p-4 text-center">
        <h1 className="text-h1">Demo mode is off</h1>
        <p className="max-w-sm text-text-muted">The scenario controller only runs when NEXT_PUBLIC_DEMO=1.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-5xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-h1">Demo controller</h1>
          <p className="mt-1 text-text-muted">{session ? `Signed in as ${session.displayName}` : "Sign in as the demo trekker to run the scenario."}</p>
        </div>
        <div className="flex items-center gap-2">
          <Status tone={online ? "ok" : "warning"} icon={online ? <Wifi aria-hidden /> : <WifiOff aria-hidden />}>
            {online ? "Online" : "Offline"}
          </Status>
          <Status icon={<Clock aria-hidden />}>Outbox {pending}</Status>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: "/trek", label: "Trek mode", icon: <Mountain className="size-4 text-accent" /> },
          { href: "/rescue", label: "Rescue dashboard", icon: <LifeBuoy className="size-4 text-sos" /> },
        ].map((l) => (
          <Button key={l.href} asChild variant="secondary" className="justify-between">
            <Link href={l.href} target="_blank">
              <span className="flex items-center gap-2">
                {l.icon}
                {l.label}
              </span>
              <ExternalLink className="size-4 text-text-muted" />
            </Link>
          </Button>
        ))}
        <Button
          variant="secondary"
          className="justify-start"
          disabled={!shareToken}
          onClick={async () => {
            const url = `${window.location.origin}/share/${shareToken}`
            try {
              await navigator.clipboard.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
              addLog(`Share link copied: ${url}`)
            } catch {
              toast.error("Couldn't copy the link.")
            }
          }}
        >
          <Share2 className="size-4 text-accent" />
          {copied ? "Link copied" : "Copy family link"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-h2">Scenario</h2>
            <Button variant="danger" size="sm" disabled={running !== null} onClick={() => exec("reset", demoDriver.reset)}>
              <RotateCcw className="size-4" />
              {running === "reset" ? "Resetting…" : "Reset"}
            </Button>
          </div>

          {steps.map((step, i) => (
            <Panel key={step.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-accent-bg font-mono text-small text-accent">{i + 1}</span>
                    <h3 className="text-body font-medium">{step.title}</h3>
                    {done.has(step.id) && <CheckCircle2 className="size-4 text-ok" aria-label="Done" />}
                  </div>
                  <p className="pl-8 text-small text-text-muted">{step.detail}</p>
                </div>
                <Button
                  size="sm"
                  variant={step.id === "sos" ? "sos" : "secondary"}
                  disabled={running !== null || !session}
                  onClick={() => exec(step.id, step.run)}
                  className="min-w-[120px] shrink-0"
                >
                  {running === step.id ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : step.icon}
                  Run
                </Button>
              </div>
              {step.id === "checkin" && (
                <label className="ml-8 flex cursor-pointer items-center gap-2 border-t border-line pt-2 text-small">
                  <input type="checkbox" checked={ataxia} onChange={(e) => setAtaxia(e.target.checked)} className="size-5 accent-danger" />
                  Add red flag: can&apos;t walk heel-to-toe (ataxia)
                </label>
              )}
              {step.id === "storm" && (
                <div className="ml-8 flex items-center justify-between gap-3 border-t border-line pt-2 text-small">
                  <span className="text-text-muted">Simulate airplane mode on this browser before the SOS step.</span>
                  <Button size="sm" variant={forcedOffline ? "primary" : "secondary"} onClick={() => demoDriver.setOffline(!forcedOffline)}>
                    {forcedOffline ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
                    {forcedOffline ? "Go online" : "Go offline"}
                  </Button>
                </div>
              )}
            </Panel>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-h2">Log</h2>
          <ol aria-live="polite" className="flex h-[460px] flex-col space-y-1.5 overflow-y-auto rounded-[var(--radius-lg)] border border-line bg-surface p-3 font-mono text-small">
            {log.length === 0 && <li className="text-text-muted">Ready.</li>}
            {log.map((line, i) => (
              <li key={i} className={cn("border-b border-line pb-1", line.includes("✖") ? "text-danger" : "text-ok")}>
                {line}
              </li>
            ))}
          </ol>
          <Panel title="Active trek">
            <p className="font-mono text-small text-text-muted">{session?.trek ? session.trek.id : "None"}</p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
