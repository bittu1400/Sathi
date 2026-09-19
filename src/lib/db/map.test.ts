import { describe, expect, it } from "vitest";
import { checkinToRow, sosToRow, toCheckin, toSos, type CheckinRow, type SosRow } from "./map";

describe("db mappers", () => {
  it("round-trips a check-in and never sends the generated lls column", () => {
    const row: CheckinRow = {
      id: "c1",
      trek_id: "t1",
      recorded_at: "2026-09-19T13:00:00Z",
      headache: 2,
      gi: 1,
      fatigue: 1,
      dizziness: 0,
      red_flags: null,
      sleep_waypoint_id: "ebc-lobuche",
      sleep_alt_m: 4940,
      lls: 4,
    };
    const checkin = toCheckin(row);
    expect(checkin.redFlags).toEqual([]);
    expect(checkinToRow(checkin)).not.toHaveProperty("lls");
  });

  it("maps resolution_note and never sends coordinator fields on insert", () => {
    const row = {
      id: "s1",
      trek_id: null,
      user_id: "u1",
      lat: 27.9,
      lng: 86.8,
      alt_m: 4940,
      accuracy_m: 10,
      category: "injury",
      note: null,
      last_checkin_lls: null,
      created_at: "2026-09-19T13:00:00Z",
      received_at: "2026-09-19T13:00:01Z",
      channel: "online",
      status: "resolved",
      acknowledged_by: "c1",
      acknowledged_at: "2026-09-19T13:01:00Z",
      resolved_at: "2026-09-19T14:00:00Z",
      resolution_note: "Escorted down",
    } satisfies SosRow;
    const sos = toSos(row);
    expect(sos.resolutionNotes).toBe("Escorted down");
    const insert = sosToRow(sos);
    expect(insert).not.toHaveProperty("acknowledged_by");
    expect(insert).not.toHaveProperty("received_at");
  });
});
