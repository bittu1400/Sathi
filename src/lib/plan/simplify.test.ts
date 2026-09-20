import { describe, expect, it } from "vitest";
import { simplifyLine } from "./simplify";

describe("simplifyLine", () => {
  it("drops the points that sit on a straight line", () => {
    const line = Array.from({ length: 50 }, (_, i) => [85.3, 27.7 + i * 0.001, 1000]);
    expect(simplifyLine(line)).toEqual([line[0], line[49]]);
  });

  it("keeps a corner", () => {
    const line = [
      [85.3, 27.7],
      [85.31, 27.7],
      [85.31, 27.71],
    ];
    expect(simplifyLine(line)).toHaveLength(3);
  });

  it("keeps a wiggle bigger than the tolerance and drops one smaller", () => {
    // ~0.0002° of latitude is about 22 m, ~0.00002° about 2 m.
    const big = [
      [85.3, 27.7],
      [85.3002, 27.7002],
      [85.3004, 27.7],
    ];
    const small = [
      [85.3, 27.7],
      [85.30002, 27.70002],
      [85.30004, 27.7],
    ];
    expect(simplifyLine(big)).toHaveLength(3);
    expect(simplifyLine(small)).toHaveLength(2);
  });

  it("leaves the elevation on the points it keeps", () => {
    const line = [
      [85.3, 27.7, 1300],
      [85.31, 27.7, 1400],
      [85.31, 27.71, 1500],
    ];
    expect(simplifyLine(line)[2]).toEqual([85.31, 27.71, 1500]);
  });

  it("gives back a line too short to simplify", () => {
    expect(simplifyLine([[85.3, 27.7]])).toHaveLength(1);
  });
});
