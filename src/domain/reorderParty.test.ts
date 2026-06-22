import { describe, expect, it } from "vitest";
import { reorderParty } from "./reorderParty";
import type { PartySlot } from "./types";

const party: PartySlot[] = [
  { kind: "owned", servant: null },
  { kind: "owned", servant: null },
  { kind: "owned", servant: null },
  { kind: "support", servant: null },
];

describe("reorderParty", () => {
  it("swaps the source and target slots without shifting middle slots", () => {
    const result = reorderParty(party, 3, 0);

    expect(result.map(({ kind }) => kind)).toEqual([
      "support",
      "owned",
      "owned",
      "owned",
    ]);
    expect(result[3]).toBe(party[0]);
    expect(party[3].kind).toBe("support");
  });

  it("moves the last-slot support directly to the first slot in reverse", () => {
    const result = reorderParty(party, 0, 3);

    expect(result.map(({ kind }) => kind)).toEqual([
      "support",
      "owned",
      "owned",
      "owned",
    ]);
    expect(result[3]).toBe(party[0]);
  });

  it("returns the same party for invalid or unchanged moves", () => {
    expect(reorderParty(party, 1, 1)).toBe(party);
    expect(reorderParty(party, -1, 2)).toBe(party);
  });
});
