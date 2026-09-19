import { describe, expect, it } from "vitest"
import { safeNext } from "./safe-next"

describe("safeNext", () => {
  it.each(["/trek", "/rescue?tab=open"])("keeps same-origin path %s", (path) => {
    expect(safeNext(path)).toBe(path)
  })

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "trek", null])(
    "rejects %s",
    (value) => {
      expect(safeNext(value)).toBe("/trek")
    },
  )
})
