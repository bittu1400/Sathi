"use client"

import * as React from "react"
import Link from "next/link"
import { demoDriver } from "@/lib/demo/driver"
import { useConnectivity } from "@/lib/offline/status"
import { subscribeOutboxStatus } from "@/lib/outbox"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"

interface StepStatus {
  completed: boolean
  running: boolean
}

interface StepsState {
  reset: StepStatus
  startTrek: StepStatus
  fastForward: StepStatus
  advanceLobuche: StepStatus
  badCheckin: StepStatus
  weatherStorm: StepStatus
  sos: StepStatus
  sync: StepStatus
}

export default function DemoPage() {
  const isDemoEnv = process.env.NEXT_PUBLIC_DEMO === "1"
  const { online, forcedOffline, toggleForcedOffline } = useConnectivity()

  const [activeTrekId, setActiveTrekId] = React.useState<string | null>(() => demoDriver.getActiveTrekId())
  const [shareToken, setShareToken] = React.useState<string | null>(() => demoDriver.getActiveShareToken())
  const [includeAtaxia, setIncludeAtaxia] = React.useState(false)
  const [outboxPending, setOutboxPending] = React.useState(0)
  const [log, setLog] = React.useState<string[]>(["Operator panel initialized. Ready for rehearsal."])
  const [copiedShare, setCopiedShare] = React.useState(false)

  const [steps, setSteps] = React.useState<StepsState>({
    reset: { completed: false, running: false },
    startTrek: { completed: false, running: false },
    fastForward: { completed: false, running: false },
    advanceLobuche: { completed: false, running: false },
    badCheckin: { completed: false, running: false },
    weatherStorm: { completed: false, running: false },
    sos: { completed: false, running: false },
    sync: { completed: false, running: false },
  })

  React.useEffect(() => {
    const unsub = subscribeOutboxStatus((status) => {
      setOutboxPending(status.pending)
    })

    const handleStorage = () => {
      setActiveTrekId(demoDriver.getActiveTrekId())
      setShareToken(demoDriver.getActiveShareToken())
    }

    window.addEventListener("storage", handleStorage)
    return () => {
      unsub()
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false })
    setLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 19)])
  }

  const setStepStatus = (id: keyof StepsState, running: boolean, completed: boolean) => {
    setSteps((prev) => ({
      ...prev,
      [id]: { running, completed: completed || prev[id].completed },
    }))
  }

  const handleReset = async () => {
    setStepStatus("reset", true, false)
    try {
      const res = await demoDriver.reset()
      setActiveTrekId(null)
      setShareToken(null)
      setSteps({
        reset: { completed: true, running: false },
        startTrek: { completed: false, running: false },
        fastForward: { completed: false, running: false },
        advanceLobuche: { completed: false, running: false },
        badCheckin: { completed: false, running: false },
        weatherStorm: { completed: false, running: false },
        sos: { completed: false, running: false },
        sync: { completed: false, running: false },
      })
      addLog(res.message)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`Reset error: ${errMsg}`)
      setStepStatus("reset", false, false)
    }
  }

  const handleStartTrek = async () => {
    setStepStatus("startTrek", true, false)
    try {
      const res = await demoDriver.startEbcTrek()
      setActiveTrekId(res.trekId)
      setShareToken(res.shareToken)
      setStepStatus("startTrek", false, true)
      addLog(`Started EBC Trek (ID: ${res.trekId.slice(0, 8)}...). Pass active for 14 days.`)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`Start trek error: ${errMsg}`)
      setStepStatus("startTrek", false, false)
    }
  }

  const handleFastForward = async () => {
    setStepStatus("fastForward", true, false)
    try {
      const res = await demoDriver.fastForwardDingboche(activeTrekId || undefined)
      setStepStatus("fastForward", false, true)
      addLog(`Fast-forwarded to Day 6 (Dingboche 4,410m). Enqueued ${res.insertedCount} track points.`)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`Fast-forward error: ${errMsg}`)
      setStepStatus("fastForward", false, false)
    }
  }

  const handleAdvanceLobuche = async () => {
    setStepStatus("advanceLobuche", true, false)
    try {
      const res = await demoDriver.advanceToLobuche(activeTrekId || undefined)
      setStepStatus("advanceLobuche", false, true)
      addLog(`Advanced to Day 7 (Lobuche ${res.altitudeM}m). +530m sleep gain caution alert enqueued.`)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`Advance Lobuche error: ${errMsg}`)
      setStepStatus("advanceLobuche", false, false)
    }
  }

  const handleBadCheckin = async () => {
    setStepStatus("badCheckin", true, false)
    try {
      const res = await demoDriver.submitBadCheckin(
        { includeAtaxia },
        activeTrekId || undefined
      )
      setStepStatus("badCheckin", false, true)
      addLog(
        `Submitted check-in: LLS ${res.lls}, Ataxia: ${includeAtaxia ? "YES" : "NO"} -> Triggered ${res.severity.toUpperCase()} alert.`
      )
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`Bad check-in error: ${errMsg}`)
      setStepStatus("badCheckin", false, false)
    }
  }

  const handleWeatherStorm = async () => {
    setStepStatus("weatherStorm", true, false)
    try {
      const res = await demoDriver.injectStormWeather(activeTrekId || undefined)
      setStepStatus("weatherStorm", false, true)
      addLog(`Injected 82 km/h gale fixture for Kongma La. Verdict: ${res.verdict.toUpperCase()}.`)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`Weather error: ${errMsg}`)
      setStepStatus("weatherStorm", false, false)
    }
  }

  const handleTriggerSos = async () => {
    setStepStatus("sos", true, false)
    try {
      const res = await demoDriver.triggerSos(activeTrekId || undefined)
      setStepStatus("sos", false, true)
      addLog(`Emergency SOS dispatched (Channel: ${res.channel.toUpperCase()}). SOS ID: ${res.sosId.slice(0, 8)}...`)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`SOS error: ${errMsg}`)
      setStepStatus("sos", false, false)
    }
  }

  const handleBackOnlineAndFlush = async () => {
    setStepStatus("sync", true, false)
    try {
      const res = await demoDriver.backOnlineAndFlush()
      setStepStatus("sync", false, true)
      addLog(`Online connection restored. Flushed ${res.sent} items to rescue coordinator.`)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`Sync error: ${errMsg}`)
      setStepStatus("sync", false, false)
    }
  }

  const copyShareLink = () => {
    if (!shareToken) return
    const url = `${window.location.origin}/share/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2000)
    addLog(`Share link copied: ${url}`)
  }

  if (!isDemoEnv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
        <h1 className="text-xl font-bold mb-2">Demo Mode Disabled</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          The pitch scenario controller is only active when NEXT_PUBLIC_DEMO=1 is configured.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Sathi Demo Controller</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
              OPERATOR PANEL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            SPEC §13 · 3-Minute Live Stage & Pitch Scenario Runner (Owner: C)
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border border-border">
            {online ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500" />
            )}
            <span>{online ? "ONLINE" : "OFFLINE"}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border border-border">
            <Clock className="w-4 h-4 text-primary" />
            <span>OUTBOX: {outboxPending}</span>
          </div>
        </div>
      </header>

      {/* Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/trek"
          target="_blank"
          className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-primary" />
            <span>Open Trek Mode</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </Link>

        <Link
          href="/rescue"
          target="_blank"
          className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-red-500" />
            <span>Open Rescue Dashboard</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </Link>

        <button
          onClick={copyShareLink}
          disabled={!shareToken}
          className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-500" />
            <span>{copiedShare ? "Link Copied!" : "Copy Share Link"}</span>
          </div>
          {shareToken && <span className="text-xs text-muted-foreground font-mono">{shareToken.slice(0, 6)}</span>}
        </button>
      </div>

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Controls */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base font-semibold">Pitch Timeline Sequence</h2>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              disabled={steps.reset.running}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{steps.reset.running ? "Resetting..." : "Reset All State"}</span>
            </Button>
          </div>

          {/* Step 1: Start Trek */}
          <div className="p-4 rounded-lg bg-card border border-border flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  1
                </span>
                <h3 className="font-semibold text-sm">Start EBC Trek</h3>
                {steps.startTrek.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                Creates active trek (started 8 days ago), activates 14-day Trek Pass, generates share token.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleStartTrek}
              disabled={steps.startTrek.running}
              className="shrink-0 min-w-[110px]"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              {steps.startTrek.running ? "Starting..." : "Start Trek"}
            </Button>
          </div>

          {/* Step 2: Fast-forward to Dingboche */}
          <div className="p-4 rounded-lg bg-card border border-border flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <h3 className="font-semibold text-sm">Fast-forward to Dingboche</h3>
                {steps.fastForward.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                Days 1–6: Lukla → Phakding → Namche → Tengboche → Dingboche Rest (4,410m). Everything green.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFastForward}
              disabled={steps.fastForward.running}
              className="shrink-0 min-w-[110px]"
            >
              <FastForward className="w-3.5 h-3.5 mr-1" />
              {steps.fastForward.running ? "Fast-fwd..." : "Fast-forward"}
            </Button>
          </div>

          {/* Step 3: Advance to Lobuche */}
          <div className="p-4 rounded-lg bg-card border border-border flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  3
                </span>
                <h3 className="font-semibold text-sm">Advance to Lobuche (+530m Gain)</h3>
                {steps.advanceLobuche.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                Day 7: Dingboche → Lobuche (4,940m). Triggers R6 Caution banner: &quot;You&apos;re climbing fast.&quot;
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdvanceLobuche}
              disabled={steps.advanceLobuche.running}
              className="shrink-0 min-w-[110px]"
            >
              <Mountain className="w-3.5 h-3.5 mr-1" />
              {steps.advanceLobuche.running ? "Advancing..." : "Advance"}
            </Button>
          </div>

          {/* Step 4: Bad Check-in */}
          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                    4
                  </span>
                  <h3 className="font-semibold text-sm">Submit Symptom Check-in</h3>
                  {steps.badCheckin.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Lake Louise Score: 7 (Headache 2, Fatigue 2, GI 2, Dizziness 1). WMS guidelines advice.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBadCheckin}
                disabled={steps.badCheckin.running}
                className="shrink-0 min-w-[110px]"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                {steps.badCheckin.running ? "Checking in..." : "Submit LLS 7"}
              </Button>
            </div>

            {/* Ataxia Red Flag Toggle */}
            <div className="ml-8 pt-2 border-t border-border flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAtaxia}
                  onChange={(e) => setIncludeAtaxia(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="font-medium text-foreground">Include Red Flag: Ataxia (Stumbling / Can&apos;t walk heel-to-toe)</span>
              </label>
              <span className={`font-mono text-xs ${includeAtaxia ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                {includeAtaxia ? "LEVEL: DANGER" : "LEVEL: WARNING"}
              </span>
            </div>
          </div>

          {/* Step 5: Weather Turns */}
          <div className="p-4 rounded-lg bg-card border border-border flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  5
                </span>
                <h3 className="font-semibold text-sm">Weather Turns (Kongma La Storm)</h3>
                {steps.weatherStorm.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                Injects 82 km/h wind gusts fixture. High pass weather verdict becomes &quot;NO GO&quot;.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWeatherStorm}
              disabled={steps.weatherStorm.running}
              className="shrink-0 min-w-[110px]"
            >
              <CloudLightning className="w-3.5 h-3.5 mr-1 text-blue-400" />
              {steps.weatherStorm.running ? "Injecting..." : "Inject Storm"}
            </Button>
          </div>

          {/* Step 6: Airplane Mode & SOS Fallback */}
          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                    6
                  </span>
                  <h3 className="font-semibold text-sm">Airplane Mode Simulator</h3>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Forces offline on this browser tab to demonstrate SMS offline fallback panel and outbox queuing.
                </p>
              </div>
              <Button
                variant={forcedOffline ? "default" : "outline"}
                size="sm"
                onClick={toggleForcedOffline}
                className="shrink-0 min-w-[110px]"
              >
                {forcedOffline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 mr-1" />
                    Go Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 mr-1" />
                    Go Offline
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step 7: Trigger Emergency SOS */}
          <div className="p-4 rounded-lg bg-card border border-border flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  7
                </span>
                <h3 className="font-semibold text-sm">Trigger Emergency SOS</h3>
                {steps.sos.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                Lobuche (4,940m), Altitude Illness. Queues locally in airplane mode or posts live when online.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleTriggerSos}
              disabled={steps.sos.running}
              className="shrink-0 min-w-[110px]"
            >
              <LifeBuoy className="w-3.5 h-3.5 mr-1" />
              {steps.sos.running ? "Dispatching..." : "Trigger SOS"}
            </Button>
          </div>

          {/* Step 8: Restore Connection & Flush */}
          <div className="p-4 rounded-lg bg-card border border-border flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  8
                </span>
                <h3 className="font-semibold text-sm">Back Online &amp; Flush Outbox</h3>
                {steps.sync.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                Restores network, flushes queued SOS and track data live into coordinator dashboard.
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleBackOnlineAndFlush}
              disabled={steps.sync.running}
              className="shrink-0 min-w-[110px] bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Wifi className="w-3.5 h-3.5 mr-1" />
              {steps.sync.running ? "Flushing..." : "Back Online"}
            </Button>
          </div>
        </div>

        {/* Console / Event Log */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Operator Event Log</h2>
          <div className="p-3 rounded-lg bg-black/80 text-emerald-400 font-mono text-xs border border-border h-[460px] overflow-y-auto space-y-1.5 flex flex-col-reverse">
            {log.map((item, idx) => (
              <div key={idx} className="leading-relaxed border-b border-emerald-900/30 pb-1">
                {item}
              </div>
            ))}
          </div>

          {/* Active Trek Card */}
          <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs space-y-1">
            <p className="font-semibold text-foreground">Current Active Trek:</p>
            <p className="font-mono text-muted-foreground">
              {activeTrekId ? `${activeTrekId}` : "None (tap Start Trek to begin)"}
            </p>
            {shareToken && (
              <p className="font-mono text-muted-foreground pt-1">
                Share: /share/{shareToken}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
