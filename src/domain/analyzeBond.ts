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
const SUPPORT_SHARE_BOND_BONUS = 4;
const ACTIVITY_BOND_BONUS = 0;

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
  party: PartySlot[],
) => {
  let bestScore = Number.NEGATIVE_INFINITY;
  let best: BondCraftEssence[] = [];

  const scoreAssignment = (selected: BondCraftEssence[]) => {
    let percentBonus = 0;
    let flatBonus = 0;
    selected.forEach((craftEssence, index) => {
      const value =
        slots[index].kind === "support"
          ? craftEssence.supportValue
          : craftEssence.ownedValue;
      if (craftEssence.effect === "percent") percentBonus += value;
      else flatBonus += value;
    });

    const afterEquipment = Math.floor(
      baseBond * (1 + (percentBonus + ACTIVITY_BOND_BONUS) / 100),
    );
    const supportInStartingLineup = party
      .slice(0, STARTING_MEMBER_SLOT_COUNT)
      .some(({ kind, servant }) => kind === "support" && servant !== null);

    return slots.reduce((total, slot) => {
      const slotIndex = party.indexOf(slot);
      if (slot.kind !== "owned" || !slot.servant?.bondEligible) return total;
      const startingMemberPercent =
        slotIndex < STARTING_MEMBER_SLOT_COUNT
          ? STARTING_MEMBER_BOND_BONUS
          : 0;
      const supportSharePercent = supportInStartingLineup
        ? SUPPORT_SHARE_BOND_BONUS
        : 0;
      const afterPosition = Math.floor(
        afterEquipment *
          (1 + (startingMemberPercent + supportSharePercent) / 100),
      );
      return total + afterPosition + flatBonus;
    }, 0);
  };

  const visit = (
    index: number,
    used: Set<string>,
    selected: BondCraftEssence[],
  ) => {
    if (index === slots.length) {
      const score = scoreAssignment(selected);
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
      visit(index + 1, used, selected);
      selected.pop();
      used.delete(craftEssence.id);
    }
  };

  visit(0, new Set(), []);
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
  if (selectedSlots.filter(({ kind }) => kind === "support").length !== 1) {
    throw new Error("阵容中必须且只能有一名助战英灵。");
  }
  if (availableCraftEssences.length < selectedSlots.length) {
    throw new Error("可用羁绊礼装数量不足，请在礼装库存中至少启用与阵容人数相同的礼装。");
  }

  const assignment = optimizeAssignments(
    selectedSlots,
    availableCraftEssences,
    settings.baseBond,
    party,
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
  const afterEquipment = Math.floor(
    settings.baseBond *
      (1 + (percentBonus + ACTIVITY_BOND_BONUS) / 100),
  );
  const supportInStartingLineup = party
    .slice(0, STARTING_MEMBER_SLOT_COUNT)
    .some(({ kind, servant }) => kind === "support" && servant !== null);
  const supportSharePercent = supportInStartingLineup
    ? SUPPORT_SHARE_BOND_BONUS
    : 0;

  const recommendations = selectedSlots.map((slot, index) => {
    const slotIndex = party.indexOf(slot);
    const startingMemberPercent =
      slot.kind === "owned" && slotIndex < STARTING_MEMBER_SLOT_COUNT
        ? STARTING_MEMBER_BOND_BONUS
        : 0;
    const afterPosition =
      slot.kind === "owned" && slot.servant.bondEligible
        ? Math.floor(
            afterEquipment *
              (1 + (startingMemberPercent + supportSharePercent) / 100),
          )
        : null;
    const finalBond = afterPosition === null ? null : afterPosition + flatBonus;

    const calculation =
      afterPosition === null
        ? null
        : {
            baseBond: settings.baseBond,
            equipmentPercent: percentBonus,
            activityPercent: ACTIVITY_BOND_BONUS,
            afterEquipment,
            startingMemberPercent,
            supportSharePercent,
            afterPosition,
            fixedBonus: flatBonus,
            finalBond: afterPosition + flatBonus,
          };

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
      positionBonusPercent:
        slot.kind === "owned"
          ? startingMemberPercent + supportSharePercent
          : 0,
      finalBond,
      calculation,
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
    supportInStartingLineup,
    activityPercent: ACTIVITY_BOND_BONUS,
    notes: [
      "第一步：基础羁绊 ×（1 + 全队礼装百分比 + 活动百分比），结果向下取整。当前活动百分比暂按 0% 计算。",
      supportInStartingLineup
        ? "第二步：助战位于前三个首发槽位，其 20% 首发加成平摊给五名自有英灵，每名获得 4%；首发自有英灵再叠加自身 20%，因此首发乘 1.24、后备乘 1.04，结果向下取整。"
        : "第二步：助战位于后备，无法获得首发 20% 且不触发平摊；首发自有英灵乘 1.20，后备自有英灵乘 1.00，结果向下取整。",
      "第三步：在前两步完成后，再加上英灵肖像等固定羁绊值；固定值不参与前面的百分比乘算。",
      "羁绊加成礼装对首发与后备成员均生效；助战英灵自身不计入你的羁绊收益。",
      eligibleServantCount < selectedSlots.filter(({ kind }) => kind === "owned").length
        ? "玛修当前按无法通过普通关卡获得羁绊处理，但她佩戴的礼装仍可为其他成员提供全队加成。"
        : "当前按常驻关卡规则计算，暂未叠加活动或主线的特性羁绊奖励。",
    ],
  };
};
