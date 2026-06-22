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
      .toEqual([1419, 1419, 1419]);
    expect(result.recommendations.slice(3, 5).map(({ finalBond }) => finalBond))
      .toEqual([1191, 1191]);
    expect(result.minServantBond).toBe(1191);
    expect(result.maxServantBond).toBe(1419);
    expect(result.totalPartyBond).toBe(6639);
    expect(result.recommendations[0].calculation).toEqual({
      baseBond: 815,
      equipmentPercent: 40,
      activityPercent: 0,
      afterEquipment: 1141,
      startingMemberPercent: 20,
      supportSharePercent: 0,
      afterPosition: 1369,
      fixedBonus: 50,
      finalBond: 1419,
    });
  });

  it("prefers the flat portrait over a 5% CE on low-bond quests", () => {
    const result = analyzeBond(
      [fullParty[0], fullParty[5]],
      {
      baseBond: 200,
      availableCeIds: DEFAULT_AVAILABLE_CE_IDS,
      },
    );

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

  it("shares a frontline support bonus across all owned servants", () => {
    const supportFirst: PartySlot[] = [
      { kind: "support", servant: servant(6) },
      ...Array.from({ length: 5 }, (_, index) => ({
        kind: "owned" as const,
        servant: servant(index + 1),
      })),
    ];
    const result = analyzeBond(supportFirst, {
      baseBond: 815,
      availableCeIds: DEFAULT_AVAILABLE_CE_IDS,
    });

    expect(result.supportInStartingLineup).toBe(true);
    expect(
      result.recommendations.map(({ positionBonusPercent }) => positionBonusPercent),
    ).toEqual([0, 24, 24, 4, 4, 4]);
    expect(result.recommendations.map(({ finalBond }) => finalBond)).toEqual([
      null,
      1464,
      1464,
      1236,
      1236,
      1236,
    ]);
    expect(result.totalPartyBond).toBe(6636);
  });
});
