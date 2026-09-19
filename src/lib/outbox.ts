import { get, set } from "idb-keyval"
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

const OUTBOX_KEY = "outbox"

// In-memory fallback when indexedDB is unavailable (e.g. Node tests / SSR)
let memoryOutbox: OutboxItem[] | null = null

function isIdbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined"
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  if (!isIdbAvailable()) {
    if (!memoryOutbox) memoryOutbox = []
    return memoryOutbox
  }
  try {
    const items = await get<OutboxItem[]>(OUTBOX_KEY)
    return items || []
  } catch {
    if (!memoryOutbox) memoryOutbox = []
    return memoryOutbox
  }
}

async function saveOutboxItems(items: OutboxItem[]): Promise<void> {
  if (!isIdbAvailable()) {
    memoryOutbox = items
    notifyListeners()
    return
  }
  try {
    await set(OUTBOX_KEY, items)
  } catch {
    memoryOutbox = items
  }
  notifyListeners()
}

export async function clearOutbox(): Promise<void> {
  memoryOutbox = []
  if (isIdbAvailable()) {
    try {
      await set(OUTBOX_KEY, [])
    } catch {
      // Ignore
    }
  }
  isFlushing = false
  notifyListeners()
}

// Event notification system for hooks & UI
type Listener = (status: { pending: number; lastFlushAt: string | null; online: boolean }) => void
const listeners = new Set<Listener>()
let lastFlushAt: string | null = null

function notifyListeners() {
  const pending = memoryOutbox ? memoryOutbox.length : 0
  if (isIdbAvailable()) {
    getOutboxItems().then((items) => {
      const status = {
        pending: items.length,
        lastFlushAt,
        online: isOnline(),
      }
      listeners.forEach((fn) => fn(status))
    })
  } else {
    const status = {
      pending,
      lastFlushAt,
      online: isOnline(),
    }
    listeners.forEach((fn) => fn(status))
  }
}

export function subscribeOutboxStatus(fn: Listener) {
  listeners.add(fn)
  getOutboxItems().then((items) => {
    fn({
      pending: items.length,
      lastFlushAt,
      online: isOnline(),
    })
  })
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
  const id =
    (row.id as string) ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2))
  const enrichedRow = { ...row, id }

  const item: OutboxItem = {
    id,
    table,
    row: enrichedRow,
    attempts: 0,
    createdAt:
      (row.created_at as string) ||
      (row.createdAt as string) ||
      new Date().toISOString(),
  }

  const current = await getOutboxItems()
  current.push(item)
  await saveOutboxItems(current)

  if (opts.autoFlush && isOnline()) {
    flush().catch(() => {
      // Background flush
    })
  }

  return item
}

export async function flush(
  supabaseClient?: ReturnType<typeof createClient>
): Promise<{ sent: number; failed: number }> {
  if (isFlushing) {
    return { sent: 0, failed: 0 }
  }

  if (!isOnline()) {
    return { sent: 0, failed: 0 }
  }

  isFlushing = true
  let sent = 0
  let failed = 0

  try {
    const items = await getOutboxItems()
    if (items.length === 0) {
      lastFlushAt = new Date().toISOString()
      return { sent: 0, failed: 0 }
    }

    // Sort order: SOS first, then chronological by createdAt
    const sorted = [...items].sort((a, b) => {
      if (a.table === "sos_events" && b.table !== "sos_events") return -1
      if (b.table === "sos_events" && a.table !== "sos_events") return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    const supabase = supabaseClient || createClient()
    const remaining: OutboxItem[] = []

    for (const item of sorted) {
      try {
        const onConflict = item.table === "alerts" ? "trek_id,dedupe_key" : "id"
        const { error } = await supabase
          .from(item.table)
          .upsert(item.row, { onConflict, ignoreDuplicates: true })

        if (error) {
          throw error
        }

        sent++
      } catch {
        failed++
        remaining.push({
          ...item,
          attempts: item.attempts + 1,
        })
      }
    }

    await saveOutboxItems(remaining)
    lastFlushAt = new Date().toISOString()
    return { sent, failed }
  } finally {
    isFlushing = false
    notifyListeners()
  }
}

// Browser background listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flush().catch(() => {})
  })

  setInterval(async () => {
    const items = await getOutboxItems()
    if (items.length > 0 && isOnline()) {
      flush().catch(() => {})
    }
  }, 30000)
}
