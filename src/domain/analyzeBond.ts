import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";
import type {
  BondAnalysis,
  BondCraftEssence,
  BondSettings,
  PartySlot,
  SlotKind,
} from "./types";

const STARTING_MEMBER_SLOT_COUNT = 3;
const STARTING_MEMBER_BOND_BONUS = 20;

const valueForSlot = (
  craftEssence: BondCraftEssence,
  kind: SlotKind,
  baseBond: number,
) => {
  const value =
    kind === "support"
      ? craftEssence.supportValue
      : craftEssence.ownedValue;

  return craftEssence.effect === "flat" ? value : (baseBond * value) / 100;
};

const describeContribution = (
  craftEssence: BondCraftEssence,
  kind: SlotKind,
  baseBond: number,
) => {
  const value =
    kind === "support"
      ? craftEssence.supportValue
      : craftEssence.ownedValue;
  const secondary = craftEssence.secondaryBenefit
    ? `，并兼顾${craftEssence.secondaryBenefit}`
    : "";

  if (craftEssence.effect === "flat") {
    return `固定为每名可获得羁绊的自有英灵增加 ${value} 点；在当前基础羁绊下优于剩余百分比礼装${secondary}。`;
  }

  const estimated = Math.floor((baseBond * value) / 100);
  const supportNote =
    kind === "support" && craftEssence.id === "chaldea-teatime"
      ? "；该礼装在助战位由 5% 提升至 15%"
      : "";
  return `为全队每名可获得羁绊的自有英灵增加 ${value}%（当前约 ${estimated} 点）${supportNote}${secondary}。`;
};

/**
 * Finds the maximum-value one-to-one CE assignment.
 *
 * There are at most six slots and a small CE pool, so exhaustive search is
 * intentionally preferred over a heuristic. It is deterministic, auditable,
 * and remains correct when support-only values or flat bonuses are added.
 */
const optimizeAssignments = (
  slots: PartySlot[],
  craftEssences: BondCraftEssence[],
  baseBond: number,
) => {
  let bestScore = Number.NEGATIVE_INFINITY;
  let best: BondCraftEssence[] = [];

  const visit = (
    index: number,
    used: Set<string>,
    selected: BondCraftEssence[],
    score: number,
  ) => {
    if (index === slots.length) {
      if (score > bestScore) {
        bestScore = score;
        best = [...selected];
      }
      return;
    }

    for (const craftEssence of craftEssences) {
      if (used.has(craftEssence.id)) continue;
      used.add(craftEssence.id);
      selected.push(craftEssence);
      visit(
        index + 1,
        used,
        selected,
        score + valueForSlot(craftEssence, slots[index].kind, baseBond),
      );
      selected.pop();
      used.delete(craftEssence.id);
    }
  };

  visit(0, new Set(), [], 0);
  return best;
};

export const analyzeBond = (
  party: PartySlot[],
  settings: BondSettings,
): BondAnalysis => {
  const selectedSlots = party.filter(
    (slot): slot is PartySlot & { servant: NonNullable<PartySlot["servant"]> } =>
      slot.servant !== null,
  );
  const availableCraftEssences = BOND_CRAFT_ESSENCES.filter((craftEssence) =>
    settings.availableCeIds.includes(craftEssence.id),
  );

  if (selectedSlots.length === 0) {
    throw new Error("请至少选择一名英灵。");
  }
  if (availableCraftEssences.length < selectedSlots.length) {
    throw new Error("可用羁绊礼装数量不足，请在礼装库存中至少启用与阵容人数相同的礼装。");
  }

  const assignment = optimizeAssignments(
    selectedSlots,
    availableCraftEssences,
    settings.baseBond,
  );
  const eligibleServantCount = selectedSlots.filter(
    ({ kind, servant }) => kind === "owned" && servant.bondEligible,
  ).length;

  let percentBonus = 0;
  let flatBonus = 0;
  assignment.forEach((craftEssence, index) => {
    const slot = selectedSlots[index];
    const value =
      slot.kind === "support"
        ? craftEssence.supportValue
        : craftEssence.ownedValue;
    if (craftEssence.effect === "percent") percentBonus += value;
    else flatBonus += value;
  });

  const baseTotal = settings.baseBond * eligibleServantCount;
  const recommendations = selectedSlots.map((slot, index) => {
    const slotIndex = party.indexOf(slot);
    const positionBonusPercent =
      slot.kind === "owned" && slotIndex < STARTING_MEMBER_SLOT_COUNT
        ? STARTING_MEMBER_BOND_BONUS
        : 0;
    const finalBond =
      slot.kind === "owned" && slot.servant.bondEligible
        ? Math.floor(
            settings.baseBond *
              (1 + (percentBonus + positionBonusPercent) / 100),
          ) + flatBonus
        : null;

    return {
      slotIndex,
      servant: slot.servant,
      craftEssence: assignment[index],
      reason: describeContribution(
        assignment[index],
        slot.kind,
        settings.baseBond,
      ),
      contributionPerServant: Math.floor(
        valueForSlot(assignment[index], slot.kind, settings.baseBond),
      ),
      positionBonusPercent,
      finalBond,
    };
  });
  const servantBondValues = recommendations.flatMap(({ finalBond }) =>
    finalBond === null ? [] : [finalBond],
  );
  const totalPartyBond = servantBondValues.reduce(
    (total, value) => total + value,
    0,
  );

  return {
    recommendations,
    baseTotal,
    totalPartyBond,
    eligibleServantCount,
    percentBonus,
    flatBonus,
    minServantBond:
      servantBondValues.length > 0 ? Math.min(...servantBondValues) : 0,
    maxServantBond:
      servantBondValues.length > 0 ? Math.max(...servantBondValues) : 0,
    notes: [
      "前三个首发槽位中的自有英灵享受八周年实装的常驻羁绊获得量 +20%；后备成员没有此位置加成。",
      "羁绊加成礼装对首发与后备成员均生效；助战英灵自身不计入你的羁绊收益。",
      "同类百分比加成先合计后对基础羁绊计算，显示结果按整数向下取整。",
      eligibleServantCount < selectedSlots.filter(({ kind }) => kind === "owned").length
        ? "玛修当前按无法通过普通关卡获得羁绊处理，但她佩戴的礼装仍可为其他成员提供全队加成。"
        : "当前按常驻关卡规则计算，暂未叠加活动或主线的特性羁绊奖励。",
    ],
  };
};
