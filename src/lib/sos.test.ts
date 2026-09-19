import { describe, it, expect } from "vitest"
import { buildSos, smsBody, smsHref } from "./sos"

describe("SOS Engine", () => {
  it("builds a well-formed SosEvent with default values", () => {
    const sos = buildSos({
      userId: "user-123",
      category: "altitude_illness",
      lat: 27.94801,
      lng: 86.81081,
      altM: 4940,
      lastCheckinLls: 7,
    })

    expect(sos.id).toBeDefined()
    expect(sos.userId).toBe("user-123")
    expect(sos.category).toBe("altitude_illness")
    expect(sos.status).toBe("open")
    expect(sos.channel).toBe("online")
    expect(sos.lat).toBe(27.94801)
    expect(sos.createdAt).toBeDefined()
  })

  it("formats SMS body per SPEC §9.1 and keeps it under 300 characters", () => {
    const sos = buildSos({
      id: "8f3a1234-abcd-5678-ef01-123456789abc",
      userId: "u1",
      category: "altitude_illness",
      lat: 27.948,
      lng: 86.8108,
      altM: 4940,
      lastCheckinLls: 7,
    })

    const body = smsBody(sos, {
      trekkerName: "Maya",
      locationName: "Lobuche",
      routeName: "EBC",
    })

    expect(body).toContain("SOS Sathi")
    expect(body).toContain("Maya")
    expect(body).toContain("ALTITUDE ILLNESS")
    expect(body).toContain("27.9480N 86.8108E")
    expect(body).toContain("alt 4940m")
    expect(body).toContain("near Lobuche (EBC)")
    expect(body).toContain("LLS 7")
    expect(body).toContain("NPT")
    expect(body).toContain("Ref 8F3A.")
    expect(body.length).toBeLessThanOrEqual(300)
  })

  it("truncates SMS body safely to <= 300 chars even with extreme text lengths", () => {
    const sos = buildSos({
      userId: "u1",
      category: "lost",
      lat: 27.1234,
      lng: 86.5678,
    })

    const body = smsBody(sos, {
      trekkerName: "Very Long Trekker Name That Exceeds Normal Lengths And Adds Massive Overhead To The Text Payload",
      locationName: "Extremely Remote High Altitude Unnamed Pass Somewhere Deep In The Himalayas Far Away From Civilization",
      routeName: "Great Himalaya Trail High Route Section 4",
    })

    expect(body.length).toBeLessThanOrEqual(300)
    expect(body.endsWith("...") || body.endsWith(".")).toBe(true)
  })

  it("generates cross-platform sms: URI with encoded query parameter", () => {
    const uri = smsHref("+977 980-123-4567", "SOS Sathi. Maya.")
    expect(uri).toBe("sms:+9779801234567?&body=SOS%20Sathi.%20Maya.")
  })
})
