import {
  BOND_CRAFT_ESSENCES,
  EMPTY_CRAFT_ESSENCE,
  resolveCraftEssence,
} from "../data/bondCraftEssences";
import type {
  BondAnalysis,
  BondSettings,
  PartySlot,
  ResolvedBondCraftEssence,
  Servant,
  SlotKind,
} from "./types";
import {
  getMatchedTargetLabels,
  getServantBondTraits,
} from "./servantTraits";

const STARTING_MEMBER_SLOT_COUNT = 3;
const STARTING_MEMBER_BOND_BONUS = 20;
const SUPPORT_SHARE_BOND_BONUS = 4;
const ACTIVITY_BOND_BONUS = 0;

const valueForEquippedSlot = (
  craftEssence: ResolvedBondCraftEssence,
  kind: SlotKind,
) =>
  kind === "support"
    ? craftEssence.supportValue
    : craftEssence.ownedValue;

const appliesToServant = (
  craftEssence: ResolvedBondCraftEssence,
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

const buildAssignment = (
  slots: PartySlot[],
  selectedOwnedCraftEssences: ResolvedBondCraftEssence[],
  supportCraftEssence: ResolvedBondCraftEssence,
) => {
  let ownedIndex = 0;
  return slots.map(({ kind }) =>
    kind === "support"
      ? supportCraftEssence
      : selectedOwnedCraftEssences[ownedIndex++] ?? EMPTY_CRAFT_ESSENCE,
  );
};

const getEquipmentBonus = (
  servant: Servant,
  assignment: ResolvedBondCraftEssence[],
  equippedSlots: PartySlot[],
) => {
  const equipmentBreakdown: {
    name: string;
    value: number;
    state: ResolvedBondCraftEssence["state"];
    stateLabel: string;
  }[] = [];
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
      equipmentBreakdown.push({
        name: craftEssence.name,
        value,
        state: craftEssence.state,
        stateLabel: craftEssence.hasMlbEffect
          ? craftEssence.state === "mlb"
            ? "满破"
            : "未满破"
          : "已持有",
      });
    } else {
      fixed += value;
    }
  });

  return { percent, fixed, equipmentBreakdown };
};

const describeContribution = (
  craftEssence: ResolvedBondCraftEssence,
  kind: SlotKind,
  ownedServants: Servant[],
) => {
  const value = valueForEquippedSlot(craftEssence, kind);
  if (craftEssence.isEmpty) {
    return kind === "support"
      ? "该助战从者未携带礼装，因此不提供礼装羁绊加成。"
      : "受编队 Cost 上限影响，此槽位不装备羁绊礼装。";
  }
  const stateLabel = craftEssence.hasMlbEffect
    ? craftEssence.state === "mlb"
      ? "满破"
      : "未满破"
    : "已持有";
  const secondary = craftEssence.secondaryBenefit
    ? `，并兼顾${craftEssence.secondaryBenefit}`
    : "";

  if (craftEssence.effect === "flat") {
    return `装备状态：${stateLabel}。在所有百分比乘算完成后，为每名可获得羁绊的自有英灵固定增加 ${value} 点${secondary}。`;
  }

  const supportNote =
    kind === "support" && craftEssence.id === "chaldea-teatime"
      ? `；该礼装在助战位由 ${craftEssence.ownedValue}% 提升至 ${craftEssence.supportValue}%`
      : "";
  if (!craftEssence.target) {
    return `装备状态：${stateLabel}。为全队每名可获得羁绊的自有英灵增加 ${value}%${supportNote}${secondary}。`;
  }

  const matched = ownedServants.filter((servant) =>
    appliesToServant(craftEssence, servant),
  );
  const names =
    matched.length > 0 ? matched.map(({ name }) => name).join("、") : "无";
  return `装备状态：${stateLabel}。仅为〔${craftEssence.target.label}〕增加 ${value}%；当前命中 ${matched.length} 名：${names}${secondary}。`;
};

const getMatchedBeneficiaries = (
  craftEssence: ResolvedBondCraftEssence,
  ownedServants: Servant[],
) =>
  craftEssence.target
    ? ownedServants.flatMap((servant) => {
        const matchedTraits = getMatchedTargetLabels(
          servant,
          craftEssence.target!,
        );
        return matchedTraits.length > 0
          ? [
              {
                servantId: servant.id,
                servantName: servant.name,
                matchedTraits,
              },
            ]
          : [];
      })
    : [];

const calculateServantBond = (
  servant: Servant,
  slotIndex: number,
  assignment: ResolvedBondCraftEssence[],
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

const optimizeAssignments = (
  slots: PartySlot[],
  craftEssences: ResolvedBondCraftEssence[],
  supportCraftEssence: ResolvedBondCraftEssence,
  craftEssenceCostBudget: number,
  baseBond: number,
  party: PartySlot[],
) => {
  const supportInStartingLineup = party
    .slice(0, STARTING_MEMBER_SLOT_COUNT)
    .some(({ kind, servant }) => kind === "support" && servant !== null);
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestCost = Number.POSITIVE_INFINITY;
  let best: ResolvedBondCraftEssence[] = [];

  const scoreSelection = (selected: ResolvedBondCraftEssence[]) => {
    const assignment = buildAssignment(
      slots,
      selected,
      supportCraftEssence,
    );
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

  const visit = (
    startIndex: number,
    selected: ResolvedBondCraftEssence[],
    selectedCost: number,
  ) => {
    const score = scoreSelection(selected);
    if (score > bestScore || (score === bestScore && selectedCost < bestCost)) {
      bestScore = score;
      bestCost = selectedCost;
      best = buildAssignment(slots, selected, supportCraftEssence);
    }

    const ownedSlotCount = slots.filter(({ kind }) => kind === "owned").length;
    if (selected.length >= ownedSlotCount) return;

    for (let index = startIndex; index < craftEssences.length; index += 1) {
      const nextCost = selectedCost + craftEssences[index].cost;
      if (nextCost > craftEssenceCostBudget) continue;
      selected.push(craftEssences[index]);
      visit(index + 1, selected, nextCost);
      selected.pop();
    }
  };

  visit(0, [], 0);
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
  const availableCraftEssences = BOND_CRAFT_ESSENCES.flatMap(
    (craftEssence) => {
      const state =
        settings.craftEssenceStates[craftEssence.id] ?? "none";
      return state === "none"
        ? []
        : [resolveCraftEssence(craftEssence, state)];
    },
  );

  if (selectedSlots.length === 0) {
    throw new Error("请至少选择一名英灵。");
  }
  if (selectedSlots.filter(({ kind }) => kind === "support").length !== 1) {
    throw new Error("阵容中必须且只能有一名助战英灵。");
  }
  const supportSlot = selectedSlots.find(({ kind }) => kind === "support");
  if (!supportSlot?.supportCraftEssence) {
    throw new Error("请选择助战英灵携带的羁绊礼装及其突破状态。");
  }
  const supportCraftEssenceDefinition = supportSlot.supportCraftEssence.id
    ? BOND_CRAFT_ESSENCES.find(
        ({ id }) => id === supportSlot.supportCraftEssence?.id,
      )
    : null;
  if (supportSlot.supportCraftEssence.id && !supportCraftEssenceDefinition) {
    throw new Error("助战礼装数据无效，请重新选择助战配置。");
  }
  const supportCraftEssence = supportCraftEssenceDefinition
    ? resolveCraftEssence(
        supportCraftEssenceDefinition,
        supportSlot.supportCraftEssence.state,
      )
    : EMPTY_CRAFT_ESSENCE;
  const servantCost = selectedSlots.reduce(
    (total, slot) =>
      total + (slot.kind === "owned" ? slot.servant.cost : 0),
    0,
  );
  if (servantCost > settings.maxPartyCost) {
    throw new Error(
      `五名自有从者已占用 ${servantCost} Cost，超过你设置的 ${settings.maxPartyCost} Cost 上限；请调整阵容或提高上限。`,
    );
  }
  const craftEssenceCostBudget = settings.maxPartyCost - servantCost;

  const assignment = optimizeAssignments(
    selectedSlots,
    availableCraftEssences,
    supportCraftEssence,
    craftEssenceCostBudget,
    settings.baseBond,
    party,
  );
  const ownedServants = selectedSlots.flatMap(({ kind, servant }) =>
    kind === "owned" && servant.bondEligible ? [servant] : [],
  );
  const eligibleServantCount = ownedServants.length;
  const baseTotal = settings.baseBond * eligibleServantCount;
  const craftEssenceCost = selectedSlots.reduce((total, slot, index) => {
    if (slot.kind === "support") return total;
    return total + assignment[index].cost;
  }, 0);
  const partyCost = servantCost + craftEssenceCost;
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
      servantTraits: getServantBondTraits(slot.servant),
      matchedBeneficiaries: getMatchedBeneficiaries(
        assignment[index],
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
    maxPartyCost: settings.maxPartyCost,
    partyCost,
    servantCost,
    craftEssenceCost,
    remainingCost: settings.maxPartyCost - partyCost,
    notes: [
      "第一步：每名英灵分别汇总对其生效的礼装百分比，再计算基础羁绊 ×（1 + 礼装百分比 + 活动百分比），结果向下取整。特性礼装只计入满足对应职阶或特性的英灵。",
      supportInStartingLineup
        ? "第二步：助战位于前三个首发槽位，其 20% 首发加成平摊给五名自有英灵，每名获得 4%；首发自有英灵再叠加自身 20%，因此首发乘 1.24、后备乘 1.04，结果向下取整。"
        : "第二步：助战位于后备，无法获得首发 20% 且不触发平摊；首发自有英灵乘 1.20，后备自有英灵乘 1.00，结果向下取整。",
      "第三步：在前两步完成后，再加上英灵肖像等固定羁绊值；固定值不参与前面的百分比乘算。",
      `Cost 约束：五名自有从者共 ${servantCost} Cost，推荐的自有礼装共 ${craftEssenceCost} Cost，合计 ${partyCost}/${settings.maxPartyCost}；助战从者及其固定礼装不计入玩家编队 Cost。`,
      "助战礼装在选择助战时已经固定，也可以选择不携带礼装，分析器不会替换；自有礼装则从库存中选择在 Cost 上限内使整队羁绊最高的组合，必要时允许空礼装位。",
      "礼装效果对首发与后备成员均生效；助战英灵自身不计入你的羁绊收益。每张礼装按选择的未满破或满破效果计算。",
      "特性限定礼装不要求佩戴者本人符合条件；它会为队内所有符合条件的自有英灵提供加成。结果中的“受益对象”会列出实际命中的英灵与条件。",
      "“拥有灵衣之人”是系统固定特性：即使你的账号尚未取得灵衣开放权、尚未开放或当前未穿着，也符合「至诚的一针」的加成条件。",
      eligibleServantCount <
      selectedSlots.filter(({ kind }) => kind === "owned").length
        ? "玛修当前按无法通过普通关卡获得羁绊处理，但她佩戴的礼装仍可为其他成员提供加成。"
        : "当前按常驻关卡规则计算，活动加成暂按 0% 处理。",
    ],
  };
};
