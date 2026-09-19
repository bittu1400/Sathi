import { get, set, update } from "idb-keyval"
import { createClient } from "@/lib/supabase/client"
import { isOnline } from "@/lib/offline/status"

export type OutboxTable = "positions" | "checkins" | "alerts" | "sos_events"

export interface OutboxItem {
  id: string
  table: OutboxTable
  row: Record<string, unknown>
  attempts: number
  createdAt: string
}

export interface OutboxStatus {
  pending: number
  pendingSos: number
  lastFlushAt: string | null
  online: boolean
}

const OUTBOX_KEY = "outbox"

/** UUID v4. crypto.randomUUID is missing on plain-http origins (phone on LAN), getRandomValues is not. */
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6]! & 0x0f) | 0x40
  b[8] = (b[8]! & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// In-memory fallback when IndexedDB is unavailable (Node tests, private mode).
let memoryOutbox: OutboxItem[] = []

function isIdbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined"
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  if (!isIdbAvailable()) return memoryOutbox
  try {
    return (await get<OutboxItem[]>(OUTBOX_KEY)) ?? []
  } catch {
    return memoryOutbox
  }
}

/**
 * The only way the queue changes. `fn` must be synchronous: idb-keyval runs it
 * inside one readwrite transaction, so concurrent enqueue/flush never overwrite
 * each other's rows.
 */
async function mutate(fn: (items: OutboxItem[]) => OutboxItem[]): Promise<void> {
  if (isIdbAvailable()) {
    try {
      await update<OutboxItem[]>(OUTBOX_KEY, (items) => fn(items ?? []))
      notifyListeners()
      return
    } catch {
      // fall through to memory
    }
  }
  memoryOutbox = fn(memoryOutbox)
  notifyListeners()
}

export async function clearOutbox(): Promise<void> {
  memoryOutbox = []
  if (isIdbAvailable()) {
    try {
      await set(OUTBOX_KEY, [])
    } catch {
      // memory already cleared
    }
  }
  isFlushing = false
  notifyListeners()
}

type Listener = (status: OutboxStatus) => void
const listeners = new Set<Listener>()
let lastFlushAt: string | null = null

function statusOf(items: OutboxItem[]): OutboxStatus {
  return {
    pending: items.length,
    pendingSos: items.filter((i) => i.table === "sos_events").length,
    lastFlushAt,
    online: isOnline(),
  }
}

function notifyListeners() {
  if (listeners.size === 0) return
  getOutboxItems().then((items) => {
    const status = statusOf(items)
    listeners.forEach((fn) => fn(status))
  })
}

export function subscribeOutboxStatus(fn: Listener) {
  listeners.add(fn)
  getOutboxItems().then((items) => fn(statusOf(items)))
  return () => {
    listeners.delete(fn)
  }
}

let isFlushing = false

export async function enqueue(
  table: OutboxTable,
  row: Record<string, unknown>,
  opts: { autoFlush?: boolean } = { autoFlush: typeof window !== "undefined" }
): Promise<OutboxItem> {
  const id = typeof row.id === "string" && row.id ? row.id : newId()
  const item: OutboxItem = {
    id,
    table,
    row: { ...row, id },
    attempts: 0,
    createdAt:
      (row.created_at as string) || (row.recorded_at as string) || new Date().toISOString(),
  }

  // Same id enqueued twice (retry, double tap) replaces the queued row.
  await mutate((items) => [...items.filter((i) => i.id !== id), item])

  if (opts.autoFlush && isOnline()) {
    flush().catch(() => {})
  }
  return item
}

/** Patch a row that has not been sent yet. Returns false if it already left the device. */
export async function patchQueued(id: string, patch: Record<string, unknown>): Promise<boolean> {
  let found = false
  await mutate((items) =>
    items.map((i) => {
      if (i.id !== id) return i
      found = true
      return { ...i, row: { ...i.row, ...patch } }
    })
  )
  return found
}

export async function flush(
  supabaseClient?: ReturnType<typeof createClient>
): Promise<{ sent: number; failed: number }> {
  if (isFlushing || !isOnline()) return { sent: 0, failed: 0 }

  isFlushing = true
  const sent = new Set<string>()
  const failed = new Set<string>()

  try {
    const snapshot = await getOutboxItems()
    // SOS first, then oldest first.
    const sorted = [...snapshot].sort((a, b) => {
      if (a.table === "sos_events" && b.table !== "sos_events") return -1
      if (b.table === "sos_events" && a.table !== "sos_events") return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    const supabase = supabaseClient || createClient()
    for (const item of sorted) {
      const onConflict = item.table === "alerts" ? "trek_id,dedupe_key" : "id"
      try {
        const { error } = await supabase
          .from(item.table)
          .upsert(item.row, { onConflict, ignoreDuplicates: true })
        if (error) failed.add(item.id)
        else sent.add(item.id)
      } catch {
        failed.add(item.id)
      }
    }

    // Remove only what was sent; rows enqueued meanwhile stay.
    await mutate((items) =>
      items
        .filter((i) => !sent.has(i.id))
        .map((i) => (failed.has(i.id) ? { ...i, attempts: i.attempts + 1 } : i))
    )
    lastFlushAt = new Date().toISOString()
    return { sent: sent.size, failed: failed.size }
  } finally {
    isFlushing = false
    notifyListeners()
  }
}

// One set of background listeners per page, even across hot reloads.
const g = globalThis as { __sathiOutbox?: boolean }
if (typeof window !== "undefined" && !g.__sathiOutbox) {
  g.__sathiOutbox = true
  window.addEventListener("online", () => {
    flush().catch(() => {})
  })
  setInterval(async () => {
    if ((await getOutboxItems()).length > 0 && isOnline()) flush().catch(() => {})
  }, 30000)
}
