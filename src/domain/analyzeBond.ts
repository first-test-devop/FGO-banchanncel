import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";
import type {
  BondAnalysis,
  BondCraftEssence,
  BondSettings,
  PartySlot,
  Servant,
  SlotKind,
} from "./types";

const STARTING_MEMBER_SLOT_COUNT = 3;
const STARTING_MEMBER_BOND_BONUS = 20;
const SUPPORT_SHARE_BOND_BONUS = 4;
const ACTIVITY_BOND_BONUS = 0;

const valueForEquippedSlot = (
  craftEssence: BondCraftEssence,
  kind: SlotKind,
) =>
  kind === "support"
    ? craftEssence.supportValue
    : craftEssence.ownedValue;

const appliesToServant = (
  craftEssence: BondCraftEssence,
  servant: Servant,
) => {
  const target = craftEssence.target;
  if (!target) return true;

  const matchesTraits =
    !target.allTraits ||
    target.allTraits.every((trait) => servant.traits.includes(trait));
  const matchesClass =
    !target.classNames || target.classNames.includes(servant.className);
  return matchesTraits && matchesClass;
};

const assignCraftEssences = (
  slots: PartySlot[],
  selected: BondCraftEssence[],
) => {
  const supportIndex = slots.findIndex(({ kind }) => kind === "support");
  if (supportIndex < 0) return [...selected];

  let bestSupportIndex = 0;
  let bestSupportDelta = Number.NEGATIVE_INFINITY;
  selected.forEach((craftEssence, index) => {
    const delta = craftEssence.supportValue - craftEssence.ownedValue;
    if (delta > bestSupportDelta) {
      bestSupportDelta = delta;
      bestSupportIndex = index;
    }
  });

  const supportCraftEssence = selected[bestSupportIndex];
  const remaining = selected.filter((_, index) => index !== bestSupportIndex);
  const assignment: BondCraftEssence[] = [];
  let remainingIndex = 0;
  slots.forEach((_, index) => {
    if (index === supportIndex) assignment.push(supportCraftEssence);
    else assignment.push(remaining[remainingIndex++]);
  });
  return assignment;
};

const getEquipmentBonus = (
  servant: Servant,
  assignment: BondCraftEssence[],
  equippedSlots: PartySlot[],
) => {
  const equipmentBreakdown: { name: string; value: number }[] = [];
  let percent = 0;
  let fixed = 0;

  assignment.forEach((craftEssence, index) => {
    if (!appliesToServant(craftEssence, servant)) return;
    const value = valueForEquippedSlot(
      craftEssence,
      equippedSlots[index].kind,
    );
    if (craftEssence.effect === "percent") {
      percent += value;
      equipmentBreakdown.push({ name: craftEssence.name, value });
    } else {
      fixed += value;
    }
  });

  return { percent, fixed, equipmentBreakdown };
};

const describeContribution = (
  craftEssence: BondCraftEssence,
  kind: SlotKind,
  ownedServants: Servant[],
) => {
  const value = valueForEquippedSlot(craftEssence, kind);
  const secondary = craftEssence.secondaryBenefit
    ? `，并兼顾${craftEssence.secondaryBenefit}`
    : "";

  if (craftEssence.effect === "flat") {
    return `在所有百分比乘算完成后，为每名可获得羁绊的自有英灵固定增加 ${value} 点${secondary}。`;
  }

  const supportNote =
    kind === "support" && craftEssence.id === "chaldea-teatime"
      ? "；该礼装在助战位由 5% 提升至 15%"
      : "";
  if (!craftEssence.target) {
    return `为全队每名可获得羁绊的自有英灵增加 ${value}%${supportNote}${secondary}。`;
  }

  const matched = ownedServants.filter((servant) =>
    appliesToServant(craftEssence, servant),
  );
  const names =
    matched.length > 0 ? matched.map(({ name }) => name).join("、") : "无";
  return `仅为〔${craftEssence.target.label}〕增加 ${value}%；当前命中 ${matched.length} 名：${names}${secondary}。`;
};

const calculateServantBond = (
  servant: Servant,
  slotIndex: number,
  assignment: BondCraftEssence[],
  equippedSlots: PartySlot[],
  baseBond: number,
  supportInStartingLineup: boolean,
) => {
  const equipment = getEquipmentBonus(servant, assignment, equippedSlots);
  const afterEquipment = Math.floor(
    baseBond * (1 + (equipment.percent + ACTIVITY_BOND_BONUS) / 100),
  );
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

  return {
    ...equipment,
    afterEquipment,
    startingMemberPercent,
    supportSharePercent,
    afterPosition,
    finalBond: afterPosition + equipment.fixed,
  };
};

/**
 * Selects the globally best CE set, then puts the CE with the largest
 * support-only uplift onto the support slot. CE effects are party-wide, so
 * other placements do not affect score.
 */
const optimizeAssignments = (
  slots: PartySlot[],
  craftEssences: BondCraftEssence[],
  baseBond: number,
  party: PartySlot[],
) => {
  const supportInStartingLineup = party
    .slice(0, STARTING_MEMBER_SLOT_COUNT)
    .some(({ kind, servant }) => kind === "support" && servant !== null);
  let bestScore = Number.NEGATIVE_INFINITY;
  let best: BondCraftEssence[] = [];

  const scoreSelection = (selected: BondCraftEssence[]) => {
    const assignment = assignCraftEssences(slots, selected);
    return slots.reduce((total, slot) => {
      if (slot.kind !== "owned" || !slot.servant?.bondEligible) return total;
      const slotIndex = party.indexOf(slot);
      return (
        total +
        calculateServantBond(
          slot.servant,
          slotIndex,
          assignment,
          slots,
          baseBond,
          supportInStartingLineup,
        ).finalBond
      );
    }, 0);
  };

  const visit = (startIndex: number, selected: BondCraftEssence[]) => {
    if (selected.length === slots.length) {
      const score = scoreSelection(selected);
      if (score > bestScore) {
        bestScore = score;
        best = assignCraftEssences(slots, selected);
      }
      return;
    }

    const remainingNeeded = slots.length - selected.length;
    for (
      let index = startIndex;
      index <= craftEssences.length - remainingNeeded;
      index += 1
    ) {
      selected.push(craftEssences[index]);
      visit(index + 1, selected);
      selected.pop();
    }
  };

  visit(0, []);
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
    throw new Error(
      "可用羁绊礼装数量不足，请在礼装库存中至少启用与阵容人数相同的礼装。",
    );
  }

  const assignment = optimizeAssignments(
    selectedSlots,
    availableCraftEssences,
    settings.baseBond,
    party,
  );
  const ownedServants = selectedSlots.flatMap(({ kind, servant }) =>
    kind === "owned" && servant.bondEligible ? [servant] : [],
  );
  const eligibleServantCount = ownedServants.length;
  const baseTotal = settings.baseBond * eligibleServantCount;
  const supportInStartingLineup = party
    .slice(0, STARTING_MEMBER_SLOT_COUNT)
    .some(({ kind, servant }) => kind === "support" && servant !== null);

  const recommendations = selectedSlots.map((slot, index) => {
    const slotIndex = party.indexOf(slot);
    const result =
      slot.kind === "owned" && slot.servant.bondEligible
        ? calculateServantBond(
            slot.servant,
            slotIndex,
            assignment,
            selectedSlots,
            settings.baseBond,
            supportInStartingLineup,
          )
        : null;

    return {
      slotIndex,
      servant: slot.servant,
      craftEssence: assignment[index],
      reason: describeContribution(
        assignment[index],
        slot.kind,
        ownedServants,
      ),
      contributionPerServant: Math.floor(
        (settings.baseBond *
          valueForEquippedSlot(assignment[index], slot.kind)) /
          100,
      ),
      positionBonusPercent: result
        ? result.startingMemberPercent + result.supportSharePercent
        : 0,
      finalBond: result?.finalBond ?? null,
      calculation: result
        ? {
            baseBond: settings.baseBond,
            equipmentPercent: result.percent,
            equipmentBreakdown: result.equipmentBreakdown,
            activityPercent: ACTIVITY_BOND_BONUS,
            afterEquipment: result.afterEquipment,
            startingMemberPercent: result.startingMemberPercent,
            supportSharePercent: result.supportSharePercent,
            afterPosition: result.afterPosition,
            fixedBonus: result.fixed,
            finalBond: result.finalBond,
          }
        : null,
    };
  });
  const servantRecommendations = recommendations.filter(
    (item): item is typeof item & { finalBond: number; calculation: NonNullable<typeof item.calculation> } =>
      item.finalBond !== null && item.calculation !== null,
  );
  const servantBondValues = servantRecommendations.map(
    ({ finalBond }) => finalBond,
  );
  const equipmentPercentValues = servantRecommendations.map(
    ({ calculation }) => calculation.equipmentPercent,
  );
  const fixedValues = servantRecommendations.map(
    ({ calculation }) => calculation.fixedBonus,
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
    minEquipmentPercent:
      equipmentPercentValues.length > 0
        ? Math.min(...equipmentPercentValues)
        : 0,
    maxEquipmentPercent:
      equipmentPercentValues.length > 0
        ? Math.max(...equipmentPercentValues)
        : 0,
    flatBonus: fixedValues.length > 0 ? Math.max(...fixedValues) : 0,
    minServantBond:
      servantBondValues.length > 0 ? Math.min(...servantBondValues) : 0,
    maxServantBond:
      servantBondValues.length > 0 ? Math.max(...servantBondValues) : 0,
    supportInStartingLineup,
    activityPercent: ACTIVITY_BOND_BONUS,
    notes: [
      "第一步：每名英灵分别汇总对其生效的礼装百分比，再计算基础羁绊 ×（1 + 礼装百分比 + 活动百分比），结果向下取整。特性礼装只计入满足对应职阶或特性的英灵。",
      supportInStartingLineup
        ? "第二步：助战位于前三个首发槽位，其 20% 首发加成平摊给五名自有英灵，每名获得 4%；首发自有英灵再叠加自身 20%，因此首发乘 1.24、后备乘 1.04，结果向下取整。"
        : "第二步：助战位于后备，无法获得首发 20% 且不触发平摊；首发自有英灵乘 1.20，后备自有英灵乘 1.00，结果向下取整。",
      "第三步：在前两步完成后，再加上英灵肖像等固定羁绊值；固定值不参与前面的百分比乘算。",
      "礼装效果对首发与后备成员均生效；助战英灵自身不计入你的羁绊收益。当前礼装按满破效果计算。",
      eligibleServantCount <
      selectedSlots.filter(({ kind }) => kind === "owned").length
        ? "玛修当前按无法通过普通关卡获得羁绊处理，但她佩戴的礼装仍可为其他成员提供加成。"
        : "当前按常驻关卡规则计算，活动加成暂按 0% 处理。",
    ],
  };
};
