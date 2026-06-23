import {
  BOND_CRAFT_ESSENCES,
  EMPTY_CRAFT_ESSENCE,
  resolveCraftEssence,
} from "../data/bondCraftEssences";
import {
  getMatchedTargetLabels,
  getServantBondTraits,
} from "./servantTraits";
import type {
  BondAnalysis,
  BondSettings,
  CraftEssenceSelection,
  PartySlot,
  ResolvedBondCraftEssence,
  Servant,
  SlotKind,
} from "./types";

const STARTING_MEMBER_SLOT_COUNT = 3;
const STARTING_MEMBER_BOND_BONUS = 20;
const SUPPORT_SHARE_BOND_BONUS = 4;
const ACTIVITY_BOND_BONUS = 0;

interface EquippedCraftEssence {
  craftEssence: ResolvedBondCraftEssence;
  slotLabel: string;
  effectiveCost: number;
}

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
  return (
    (!target.allTraits ||
      target.allTraits.every((trait) => servant.traits.includes(trait))) &&
    (!target.classNames || target.classNames.includes(servant.className))
  );
};

const resolveSelection = (selection: CraftEssenceSelection | null | undefined) => {
  if (!selection?.id) return EMPTY_CRAFT_ESSENCE;
  const definition = BOND_CRAFT_ESSENCES.find(
    ({ id }) => id === selection.id,
  );
  if (!definition) {
    throw new Error("礼装数据无效，请重新选择配置。");
  }
  return resolveCraftEssence(definition, selection.state);
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

const describeContribution = (
  craftEssence: ResolvedBondCraftEssence,
  kind: SlotKind,
  ownedServants: Servant[],
) => {
  if (craftEssence.isEmpty) {
    return kind === "support"
      ? "该助战礼装位为空，因此不提供礼装羁绊加成。"
      : "该礼装位为空，不提供礼装羁绊加成。";
  }
  const value = valueForEquippedSlot(craftEssence, kind);
  const stateLabel = craftEssence.hasMlbEffect
    ? craftEssence.state === "mlb"
      ? "满破"
      : "未满破"
    : "已持有";
  const secondary = craftEssence.secondaryBenefit
    ? `，并兼顾${craftEssence.secondaryBenefit}`
    : "";

  if (craftEssence.effect === "flat") {
    return `装备状态：${stateLabel}。百分比乘算后，为每名可获得羁绊的自有英灵固定增加 ${value} 点${secondary}。`;
  }
  const supportNote =
    kind === "support" && craftEssence.id === "chaldea-teatime"
      ? `；助战位效果由 ${craftEssence.ownedValue}% 提升至 ${craftEssence.supportValue}%`
      : "";
  if (!craftEssence.target) {
    return `装备状态：${stateLabel}。为全队每名可获得羁绊的自有英灵增加 ${value}%${supportNote}${secondary}。`;
  }
  const matched = ownedServants.filter((servant) =>
    appliesToServant(craftEssence, servant),
  );
  return `装备状态：${stateLabel}。仅为〔${craftEssence.target.label}〕增加 ${value}%；当前命中 ${matched.length} 名：${
    matched.length ? matched.map(({ name }) => name).join("、") : "无"
  }${secondary}。`;
};

const buildAssignment = (
  slots: PartySlot[],
  selectedOwned: ResolvedBondCraftEssence[],
  supportEquips: EquippedCraftEssence[],
  grandMode: boolean,
): EquippedCraftEssence[][] => {
  const grandOwnedIndex = slots.findIndex(
    ({ kind, isGrand }) => kind === "owned" && grandMode && isGrand,
  );
  const selected = [...selectedOwned];
  let rewardCraftEssence: ResolvedBondCraftEssence | null = null;
  if (grandOwnedIndex >= 0 && selected.length > 0) {
    const rewardIndex = selected.reduce(
      (best, craftEssence, index) =>
        craftEssence.cost > selected[best].cost ? index : best,
      0,
    );
    rewardCraftEssence = selected.splice(rewardIndex, 1)[0];
  }

  let ownedIndex = 0;
  return slots.map((slot, slotIndex) => {
    if (slot.kind === "support") return supportEquips;
    const primary = selected[ownedIndex++] ?? EMPTY_CRAFT_ESSENCE;
    const equips: EquippedCraftEssence[] = [
      {
        craftEssence: primary,
        slotLabel: grandMode && slot.isGrand ? "礼装位 1" : "礼装位",
        effectiveCost: primary.cost,
      },
    ];
    if (grandMode && slotIndex === grandOwnedIndex) {
      equips.push({
        craftEssence: rewardCraftEssence ?? EMPTY_CRAFT_ESSENCE,
        slotLabel: "礼装位 3 · 报酬提示礼装",
        effectiveCost: 0,
      });
    }
    return equips;
  });
};

const getEquipmentBonus = (
  servant: Servant,
  assignment: EquippedCraftEssence[][],
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

  assignment.forEach((equips, index) => {
    equips.forEach(({ craftEssence }) => {
      if (
        craftEssence.isEmpty ||
        !appliesToServant(craftEssence, servant)
      ) {
        return;
      }
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
  });
  return { percent, fixed, equipmentBreakdown };
};

const calculateServantBond = (
  servant: Servant,
  slotIndex: number,
  assignment: EquippedCraftEssence[][],
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
  supportEquips: EquippedCraftEssence[],
  craftEssenceCostBudget: number,
  baseBond: number,
  party: PartySlot[],
  grandMode: boolean,
) => {
  const supportInStartingLineup = party
    .slice(0, STARTING_MEMBER_SLOT_COUNT)
    .some(({ kind, servant }) => kind === "support" && servant !== null);
  const ownedEquipSlotCount =
    slots.filter(({ kind }) => kind === "owned").length +
    (grandMode ? 1 : 0);
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestCost = Number.POSITIVE_INFINITY;
  let best: EquippedCraftEssence[][] = [];

  const effectiveCost = (selected: ResolvedBondCraftEssence[]) => {
    const total = selected.reduce((sum, item) => sum + item.cost, 0);
    return grandMode && selected.length
      ? total - Math.max(...selected.map(({ cost }) => cost))
      : total;
  };
  const score = (selected: ResolvedBondCraftEssence[]) => {
    const assignment = buildAssignment(
      slots,
      selected,
      supportEquips,
      grandMode,
    );
    return slots.reduce((total, slot) => {
      if (slot.kind !== "owned" || !slot.servant?.bondEligible) return total;
      return (
        total +
        calculateServantBond(
          slot.servant,
          party.indexOf(slot),
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
  ) => {
    const cost = effectiveCost(selected);
    if (cost <= craftEssenceCostBudget) {
      const currentScore = score(selected);
      if (
        currentScore > bestScore ||
        (currentScore === bestScore && cost < bestCost)
      ) {
        bestScore = currentScore;
        bestCost = cost;
        best = buildAssignment(slots, selected, supportEquips, grandMode);
      }
    }
    if (selected.length >= ownedEquipSlotCount) return;
    for (let index = startIndex; index < craftEssences.length; index += 1) {
      selected.push(craftEssences[index]);
      if (effectiveCost(selected) <= craftEssenceCostBudget) {
        visit(index + 1, selected);
      }
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
    (slot): slot is PartySlot & { servant: Servant } =>
      slot.servant !== null,
  );
  const grandMode = settings.battleMode === "grand";
  const availableCraftEssences = BOND_CRAFT_ESSENCES.flatMap(
    (craftEssence) => {
      const state =
        settings.craftEssenceStates[craftEssence.id] ?? "none";
      return state === "none"
        ? []
        : [resolveCraftEssence(craftEssence, state)];
    },
  );

  if (!selectedSlots.length) throw new Error("请至少选择一名英灵。");
  if (selectedSlots.filter(({ kind }) => kind === "support").length !== 1) {
    throw new Error("阵容中必须且只能有一名助战英灵。");
  }
  const ownedGrandCount = selectedSlots.filter(
    ({ kind, isGrand }) => kind === "owned" && isGrand,
  ).length;
  if (grandMode && ownedGrandCount !== 1) {
    throw new Error("冠位战必须且只能指定一名自有冠位英灵。");
  }

  const supportSlot = selectedSlots.find(({ kind }) => kind === "support")!;
  if (!supportSlot.supportCraftEssence) {
    throw new Error("请完成助战英灵的礼装配置。");
  }
  const supportEquips: EquippedCraftEssence[] = [
    {
      craftEssence: resolveSelection(supportSlot.supportCraftEssence),
      slotLabel:
        grandMode && supportSlot.isGrand ? "礼装位 1" : "助战礼装位",
      effectiveCost: 0,
    },
  ];
  if (grandMode && supportSlot.isGrand) {
    supportEquips.push({
      craftEssence: resolveSelection(
        supportSlot.supportRewardCraftEssence ?? {
          id: null,
          state: "mlb",
        },
      ),
      slotLabel: "礼装位 3 · 报酬提示礼装",
      effectiveCost: 0,
    });
  }

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
  const assignment = optimizeAssignments(
    selectedSlots,
    availableCraftEssences,
    supportEquips,
    settings.maxPartyCost - servantCost,
    settings.baseBond,
    party,
    grandMode,
  );
  const ownedServants = selectedSlots.flatMap(({ kind, servant }) =>
    kind === "owned" && servant.bondEligible ? [servant] : [],
  );
  const eligibleServantCount = ownedServants.length;
  const baseTotal = settings.baseBond * eligibleServantCount;
  const craftEssenceCost = assignment.reduce(
    (total, equips, index) =>
      selectedSlots[index].kind === "owned"
        ? total +
          equips.reduce((sum, { effectiveCost }) => sum + effectiveCost, 0)
        : total,
    0,
  );
  const partyCost = servantCost + craftEssenceCost;
  const supportInStartingLineup = party
    .slice(0, STARTING_MEMBER_SLOT_COUNT)
    .some(({ kind, servant }) => kind === "support" && servant !== null);

  const recommendations = selectedSlots.map((slot, index) => {
    const slotIndex = party.indexOf(slot);
    const equips = assignment[index];
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
    const equippedCraftEssences = equips.map(
      ({ craftEssence, slotLabel, effectiveCost }) => ({
        slotLabel,
        craftEssence,
        effectiveCost,
        reason: describeContribution(
          craftEssence,
          slot.kind,
          ownedServants,
        ),
        matchedBeneficiaries: getMatchedBeneficiaries(
          craftEssence,
          ownedServants,
        ),
      }),
    );
    const primary = equips[0].craftEssence;
    return {
      slotIndex,
      servant: slot.servant,
      craftEssence: primary,
      equippedCraftEssences,
      isGrand: grandMode && Boolean(slot.isGrand),
      reason: equippedCraftEssences.map(({ reason }) => reason).join(" "),
      servantTraits: getServantBondTraits(slot.servant),
      matchedBeneficiaries:
        equippedCraftEssences[0].matchedBeneficiaries,
      contributionPerServant: Math.floor(
        (settings.baseBond * valueForEquippedSlot(primary, slot.kind)) / 100,
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
    (
      item,
    ): item is typeof item & {
      finalBond: number;
      calculation: NonNullable<typeof item.calculation>;
    } => item.finalBond !== null && item.calculation !== null,
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
    battleMode: settings.battleMode,
    recommendations,
    baseTotal,
    totalPartyBond,
    eligibleServantCount,
    minEquipmentPercent: equipmentPercentValues.length
      ? Math.min(...equipmentPercentValues)
      : 0,
    maxEquipmentPercent: equipmentPercentValues.length
      ? Math.max(...equipmentPercentValues)
      : 0,
    flatBonus: fixedValues.length ? Math.max(...fixedValues) : 0,
    minServantBond: servantBondValues.length
      ? Math.min(...servantBondValues)
      : 0,
    maxServantBond: servantBondValues.length
      ? Math.max(...servantBondValues)
      : 0,
    supportInStartingLineup,
    activityPercent: ACTIVITY_BOND_BONUS,
    maxPartyCost: settings.maxPartyCost,
    partyCost,
    servantCost,
    craftEssenceCost,
    remainingCost: settings.maxPartyCost - partyCost,
    notes: [
      "第一步：每名英灵汇总所有生效礼装的百分比，再计算基础羁绊 ×（1 + 礼装百分比 + 活动百分比），结果向下取整。",
      supportInStartingLineup
        ? "第二步：助战位于首发，其 20% 首发加成平摊给五名自有英灵，每名获得 4%；首发自有英灵再叠加自身 20%。"
        : "第二步：助战位于后备；首发自有英灵乘 1.20，后备自有英灵乘 1.00，结果向下取整。",
      "第三步：完成前两步后，再加入英灵肖像等固定羁绊值。",
      `Cost：自有从者 ${servantCost} + 计费礼装 ${craftEssenceCost} = ${partyCost}/${settings.maxPartyCost}；助战配置不计 Cost。`,
      grandMode
        ? "冠位战：自有冠位英灵必须恰好一名。礼装位 1 正常计算 Cost；礼装位 2 固定为自身羁绊礼装，不参与羁绊加成优化且 Cost 为 0；礼装位 3 可装备羁绊加成礼装、允许留空且 Cost 为 0。冠位助战的两个可选礼装位均由用户固定。"
        : "普通关卡：冠位英灵按普通英灵处理，每名英灵只有一个礼装位。",
      "特性限定礼装不要求佩戴者本人符合条件，而是作用于队内所有符合条件的自有英灵。",
      "当前活动加成按 0% 处理。",
    ],
  };
};
