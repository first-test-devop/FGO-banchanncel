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
  it("moves the whole slot so the support identity follows its servant", () => {
    const result = reorderParty(party, 3, 0);

    expect(result.map(({ kind }) => kind)).toEqual([
      "support",
      "owned",
      "owned",
      "owned",
    ]);
    expect(party[3].kind).toBe("support");
  });

  it("returns the same party for invalid or unchanged moves", () => {
    expect(reorderParty(party, 1, 1)).toBe(party);
    expect(reorderParty(party, -1, 2)).toBe(party);
  });
});
