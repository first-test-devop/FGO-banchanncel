import { describe, expect, it } from "vitest";
import { DEFAULT_AVAILABLE_CE_IDS } from "../data/bondCraftEssences";
import { analyzeBond } from "./analyzeBond";
import type { PartySlot, Servant } from "./types";

const servant = (id: number): Servant => ({
  id,
  collectionNo: id,
  name: `英灵 ${id}`,
  className: "saber",
  rarity: 5,
  face: "",
  bondEligible: true,
});

const fullParty: PartySlot[] = [
  ...Array.from({ length: 5 }, (_, index) => ({
    kind: "owned" as const,
    servant: servant(index + 1),
  })),
  { kind: "support", servant: servant(6) },
];

describe("analyzeBond", () => {
  it("puts Teatime on support and maximizes a high-bond quest", () => {
    const result = analyzeBond(fullParty, {
      baseBond: 815,
      availableCeIds: DEFAULT_AVAILABLE_CE_IDS,
    });

    expect(result.recommendations[5].craftEssence.id).toBe(
      "chaldea-teatime",
    );
    expect(result.percentBonus).toBe(40);
    expect(result.flatBonus).toBe(50);
    expect(result.recommendations.slice(0, 3).map(({ finalBond }) => finalBond))
      .toEqual([1354, 1354, 1354]);
    expect(result.recommendations.slice(3, 5).map(({ finalBond }) => finalBond))
      .toEqual([1191, 1191]);
    expect(result.minServantBond).toBe(1191);
    expect(result.maxServantBond).toBe(1354);
    expect(result.totalPartyBond).toBe(6444);
  });

  it("prefers the flat portrait over a 5% CE on low-bond quests", () => {
    const result = analyzeBond(fullParty.slice(0, 2), {
      baseBond: 200,
      availableCeIds: DEFAULT_AVAILABLE_CE_IDS,
    });

    expect(result.recommendations.map((item) => item.craftEssence.id)).toContain(
      "heroic-spirit-portrait",
    );
  });

  it("does not count support servant as an owned bond recipient", () => {
    const result = analyzeBond(fullParty, {
      baseBond: 815,
      availableCeIds: DEFAULT_AVAILABLE_CE_IDS,
    });

    expect(result.eligibleServantCount).toBe(5);
    expect(result.recommendations[5].finalBond).toBeNull();
    expect(result.recommendations[5].positionBonusPercent).toBe(0);
  });

  it("only applies the starting-member bonus to the first three slots", () => {
    const result = analyzeBond(fullParty, {
      baseBond: 1000,
      availableCeIds: DEFAULT_AVAILABLE_CE_IDS,
    });

    expect(
      result.recommendations.map(({ positionBonusPercent }) => positionBonusPercent),
    ).toEqual([20, 20, 20, 0, 0, 0]);
  });
});
