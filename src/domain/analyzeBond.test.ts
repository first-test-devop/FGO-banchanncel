import { describe, expect, it } from "vitest";
import { ALL_MLB_CRAFT_ESSENCE_STATES } from "../data/bondCraftEssences";
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
  traits: [],
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
      craftEssenceStates: ALL_MLB_CRAFT_ESSENCE_STATES,
    });

    expect(result.recommendations[5].craftEssence.id).toBe(
      "chaldea-teatime",
    );
    expect(result.minEquipmentPercent).toBe(40);
    expect(result.maxEquipmentPercent).toBe(40);
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
      equipmentBreakdown: [
        { name: "迦勒底午餐时光", value: 10, state: "mlb", stateLabel: "满破" },
        { name: "名侦探芙尔摩斯", value: 5, state: "mlb", stateLabel: "满破" },
        { name: "迦勒底晚餐时光", value: 5, state: "mlb", stateLabel: "满破" },
        { name: "格兰·卡瓦洛", value: 5, state: "mlb", stateLabel: "满破" },
        { name: "迦勒底午茶时光", value: 15, state: "mlb", stateLabel: "满破" },
      ],
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
      craftEssenceStates: ALL_MLB_CRAFT_ESSENCE_STATES,
      },
    );

    expect(result.recommendations.map((item) => item.craftEssence.id)).toContain(
      "heroic-spirit-portrait",
    );
  });

  it("does not count support servant as an owned bond recipient", () => {
    const result = analyzeBond(fullParty, {
      baseBond: 815,
      craftEssenceStates: ALL_MLB_CRAFT_ESSENCE_STATES,
    });

    expect(result.eligibleServantCount).toBe(5);
    expect(result.recommendations[5].finalBond).toBeNull();
    expect(result.recommendations[5].positionBonusPercent).toBe(0);
  });

  it("only applies the starting-member bonus to the first three slots", () => {
    const result = analyzeBond(fullParty, {
      baseBond: 1000,
      craftEssenceStates: ALL_MLB_CRAFT_ESSENCE_STATES,
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
      craftEssenceStates: ALL_MLB_CRAFT_ESSENCE_STATES,
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

  it("only applies targeted bond CEs to matching servants", () => {
    const lawfulGood = {
      ...servant(1),
      name: "秩序善从者",
      traits: ["alignmentLawful", "alignmentGood"],
    };
    const unmatched = {
      ...servant(2),
      name: "不匹配从者",
    };
    const result = analyzeBond(
      [
        { kind: "owned", servant: lawfulGood },
        { kind: "owned", servant: unmatched },
        { kind: "support", servant: servant(3) },
      ],
      {
        baseBond: 1000,
        craftEssenceStates: {
          "inspection-report": "mlb",
          "chaldea-lunchtime": "mlb",
          "chaldea-teatime": "mlb",
        },
      },
    );

    expect(
      result.recommendations.find(({ servant }) => servant.id === 1)
        ?.calculation?.equipmentPercent,
    ).toBe(45);
    expect(
      result.recommendations.find(({ servant }) => servant.id === 2)
        ?.calculation?.equipmentPercent,
    ).toBe(25);
    expect(result.minEquipmentPercent).toBe(25);
    expect(result.maxEquipmentPercent).toBe(45);
    const inspectionRecommendation = result.recommendations.find(
      ({ craftEssence }) => craftEssence.id === "inspection-report",
    );
    expect(inspectionRecommendation?.matchedBeneficiaries).toEqual([
      {
        servantId: 1,
        servantName: "秩序善从者",
        matchedTraits: ["秩序", "善"],
      },
    ]);
  });

  it("uses non-MLB values when the inventory marks a CE as base", () => {
    const result = analyzeBond(fullParty, {
      baseBond: 1000,
      craftEssenceStates: {
        "chaldea-lunchtime": "base",
        "chaldea-teatime": "base",
        "detective-foumes": "base",
        "chaldea-dinnertime": "base",
        "gran-cavallo": "base",
        "heroic-spirit-portrait": "mlb",
      },
    });

    expect(result.minEquipmentPercent).toBe(8);
    expect(result.maxEquipmentPercent).toBe(8);
    expect(result.flatBonus).toBe(50);
    expect(result.recommendations[5].craftEssence).toMatchObject({
      id: "chaldea-teatime",
      state: "base",
      supportValue: 3,
    });
    expect(result.recommendations[0].calculation?.equipmentBreakdown).toEqual([
      { name: "迦勒底午餐时光", value: 2, state: "base", stateLabel: "未满破" },
      { name: "名侦探芙尔摩斯", value: 1, state: "base", stateLabel: "未满破" },
      { name: "迦勒底晚餐时光", value: 1, state: "base", stateLabel: "未满破" },
      { name: "格兰·卡瓦洛", value: 1, state: "base", stateLabel: "未满破" },
      { name: "迦勒底午茶时光", value: 3, state: "base", stateLabel: "未满破" },
    ]);
  });
});
