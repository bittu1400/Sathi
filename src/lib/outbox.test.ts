import { describe, it, expect, vi, beforeEach } from "vitest"
import { enqueue, flush, getOutboxItems, clearOutbox, newId, patchQueued } from "./outbox"

// Mock Supabase client
function createMockSupabase(handler?: (table: string, row: Record<string, unknown>, opts: { onConflict: string; ignoreDuplicates: boolean }) => Promise<{ error: Error | null }>) {
  return {
    from: vi.fn((table: string) => ({
      upsert: vi.fn((row: Record<string, unknown>, opts: { onConflict: string; ignoreDuplicates: boolean }) => {
        if (handler) {
          return handler(table, row, opts)
        }
        return Promise.resolve({ error: null })
      }),
    })),
  } as unknown as Parameters<typeof flush>[0]
}

describe("Outbox", () => {
  beforeEach(async () => {
    await clearOutbox()
  })

  it("enqueues an item with client UUID and records table and row", async () => {
    const item = await enqueue("positions", { lat: 27.9, lng: 86.8, altM: 4000 }, { autoFlush: false })
    expect(item.id).toBeDefined()
    expect(item.table).toBe("positions")
    expect(item.attempts).toBe(0)
    expect(item.row.id).toBe(item.id)

    const items = await getOutboxItems()
    expect(items.length).toBe(1)
    expect(items[0]?.id).toBe(item.id)
  })

  it("prioritizes SOS items before other items regardless of timestamp", async () => {
    // Old position
    await enqueue("positions", { id: "pos-1", created_at: "2026-09-19T10:00:00Z" }, { autoFlush: false })
    // Newer position
    await enqueue("positions", { id: "pos-2", created_at: "2026-09-19T11:00:00Z" }, { autoFlush: false })
    // Brand new SOS
    await enqueue("sos_events", { id: "sos-1", created_at: "2026-09-19T12:00:00Z" }, { autoFlush: false })

    const processedOrder: string[] = []
    const mockSupabase = createMockSupabase(async (_table, row) => {
      processedOrder.push(row.id as string)
      return { error: null }
    })

    const result = await flush(mockSupabase)
    expect(result.sent).toBe(3)
    expect(result.failed).toBe(0)
    expect(processedOrder[0]).toBe("sos-1")
    expect(processedOrder[1]).toBe("pos-1")
    expect(processedOrder[2]).toBe("pos-2")
  })

  it("uses proper onConflict keys: trek_id,dedupe_key for alerts and id for others", async () => {
    await enqueue("alerts", { id: "alt-1", trek_id: "t1", dedupe_key: "ams_gain:2026-09-19" }, { autoFlush: false })
    await enqueue("positions", { id: "pos-1" }, { autoFlush: false })

    const conflictOptions: Record<string, string> = {}
    const mockSupabase = createMockSupabase(async (table, _row, opts) => {
      conflictOptions[table] = opts.onConflict
      expect(opts.ignoreDuplicates).toBe(true)
      return { error: null }
    })

    await flush(mockSupabase)
    expect(conflictOptions["alerts"]).toBe("trek_id,dedupe_key")
    expect(conflictOptions["positions"]).toBe("id")
  })

  it("retains failed items and increments attempts", async () => {
    await enqueue("positions", { id: "pos-fail" }, { autoFlush: false })

    const mockSupabase = createMockSupabase(async () => {
      return { error: new Error("Network error") }
    })

    const result = await flush(mockSupabase)
    expect(result.sent).toBe(0)
    expect(result.failed).toBe(1)

    const remaining = await getOutboxItems()
    expect(remaining.length).toBe(1)
    expect(remaining[0]?.id).toBe("pos-fail")
    expect(remaining[0]?.attempts).toBe(1)
  })
})

describe("Outbox concurrency", () => {
  beforeEach(async () => {
    await clearOutbox()
  })

  it("keeps a row enqueued while a flush is in flight", async () => {
    await enqueue("positions", { id: "pos-1" }, { autoFlush: false })
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    const mockSupabase = createMockSupabase(async () => {
      await gate
      return { error: null }
    })

    const flushing = flush(mockSupabase)
    await enqueue("sos_events", { id: "sos-late" }, { autoFlush: false })
    release()
    expect(await flushing).toEqual({ sent: 1, failed: 0 })

    const remaining = await getOutboxItems()
    expect(remaining.map((i) => i.id)).toEqual(["sos-late"])
  })

  it("keeps both rows when two enqueues race", async () => {
    await Promise.all([
      enqueue("checkins", { id: "c-1" }, { autoFlush: false }),
      enqueue("alerts", { id: "a-1" }, { autoFlush: false }),
    ])
    expect((await getOutboxItems()).map((i) => i.id).sort()).toEqual(["a-1", "c-1"])
  })

  it("patches a queued row and reports rows that already left", async () => {
    await enqueue("sos_events", { id: "sos-1", status: "open" }, { autoFlush: false })
    expect(await patchQueued("sos-1", { status: "resolved" })).toBe(true)
    expect((await getOutboxItems())[0]?.row.status).toBe("resolved")
    expect(await patchQueued("missing", { status: "resolved" })).toBe(false)
  })

  it("generates RFC 4122 v4 ids", () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})
