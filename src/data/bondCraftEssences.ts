import type {
  BondCraftEssence,
  CraftEssenceState,
  ResolvedBondCraftEssence,
} from "../domain/types";

const atlasFace = (id: number) =>
  `https://static.atlasacademy.io/CN/Faces/f_${id}0.png`;

interface PercentCeOptions extends Partial<BondCraftEssence> {
  baseValue?: number;
  mlbValue: number;
}

const percentCe = (
  id: string,
  atlasId: number,
  name: string,
  { baseValue, mlbValue, ...options }: PercentCeOptions,
): BondCraftEssence => {
  const normalValue = baseValue ?? mlbValue;
  return {
    id,
    name,
    shortName: name,
    effect: "percent",
    baseOwnedValue: normalValue,
    mlbOwnedValue: mlbValue,
    baseSupportValue: normalValue,
    mlbSupportValue: mlbValue,
    hasMlbEffect: normalValue !== mlbValue,
    image: atlasFace(atlasId),
    ...options,
  };
};

const fsnTarget = {
  label: "Fate/stay night 从者",
  allTraits: ["FSNServant"],
};

export const BOND_CRAFT_ESSENCES: BondCraftEssence[] = [
  percentCe("chaldea-lunchtime", 9401970, "迦勒底午餐时光", {
    baseValue: 2,
    mlbValue: 10,
  }),
  percentCe("chaldea-teatime", 9403520, "迦勒底午茶时光", {
    baseValue: 1,
    mlbValue: 5,
    baseSupportValue: 3,
    mlbSupportValue: 15,
  }),
  percentCe("detective-foumes", 9403990, "名侦探芙尔摩斯", {
    baseValue: 1,
    mlbValue: 5,
    baseSecondaryBenefit: "QP +1%",
    mlbSecondaryBenefit: "QP +5%",
  }),
  percentCe("chaldea-dinnertime", 9404180, "迦勒底晚餐时光", {
    baseValue: 1,
    mlbValue: 5,
    baseSecondaryBenefit: "御主经验 +1%",
    mlbSecondaryBenefit: "御主经验 +5%",
  }),
  percentCe("gran-cavallo", 9404360, "格兰·卡瓦洛", {
    baseValue: 1,
    mlbValue: 5,
    baseSecondaryBenefit: "魔术礼装经验 +1%",
    mlbSecondaryBenefit: "魔术礼装经验 +5%",
  }),
  percentCe("beyond-the-snowy-night", 9405170, "无雪之夜过后", {
    baseValue: 1,
    mlbValue: 5,
    baseSecondaryBenefit: "助战友情点 +5",
    mlbSecondaryBenefit: "助战友情点 +25",
  }),
  percentCe("a-tale-of-wolves", 9406010, "狼的故事", {
    baseValue: 0.5,
    mlbValue: 2.5,
    baseSecondaryBenefit: "QP +0.5%",
    mlbSecondaryBenefit: "QP +2.5%",
  }),
  percentCe("toward-the-blue-sky", 9406200, "迎向碧空", {
    baseValue: 0.5,
    mlbValue: 2.5,
    baseSecondaryBenefit: "御主经验 +0.5%",
    mlbSecondaryBenefit: "御主经验 +2.5%",
  }),
  percentCe("dream-closet", 9406740, "梦想衣橱", {
    baseValue: 0.5,
    mlbValue: 2.5,
    baseSecondaryBenefit: "魔术礼装经验 +0.5%",
    mlbSecondaryBenefit: "魔术礼装经验 +2.5%",
  }),
  {
    id: "heroic-spirit-portrait",
    name: "英灵肖像",
    shortName: "英灵肖像",
    effect: "flat",
    baseOwnedValue: 50,
    mlbOwnedValue: 50,
    baseSupportValue: 50,
    mlbSupportValue: 50,
    hasMlbEffect: false,
    image: atlasFace(9400970),
  },
  percentCe("love-from-nff", 9407480, "来自ＮＦＦ的爱", {
    baseValue: 4,
    mlbValue: 20,
    target: {
      label: "兽科从者",
      allTraits: ["havingAnimalsCharacteristics"],
    },
  }),
  percentCe("chaldea-morning", 9407740, "迦勒底之晨", {
    baseValue: 4,
    mlbValue: 20,
    target: {
      label: "活在当下的人类",
      allTraits: ["livingHuman"],
    },
  }),
  percentCe("inspection-report", 9407850, "检查报告", {
    baseValue: 4,
    mlbValue: 20,
    target: {
      label: "秩序且善",
      allTraits: ["alignmentLawful", "alignmentGood"],
    },
  }),
  percentCe("wings-of-the-manuscript", 9408060, "手稿之翼", {
    baseValue: 4,
    mlbValue: 20,
    target: {
      label: "术阶从者",
      classNames: ["caster"],
    },
  }),
  percentCe("secret-mission", 9408220, "秘密任务", {
    baseValue: 4,
    mlbValue: 20,
    target: {
      label: "骑阶从者",
      classNames: ["rider"],
    },
  }),
  percentCe("a-sincere-stitch", 9408390, "至诚的一针", {
    baseValue: 4,
    mlbValue: 20,
    target: {
      label: "拥有灵衣的从者",
      allTraits: ["hasCostume"],
    },
  }),
  percentCe("bride-for-happiness", 9408590, "献给幸福的新娘", {
    baseValue: 4,
    mlbValue: 20,
    target: {
      label: "秩序的女性",
      allTraits: ["alignmentLawful", "genderFemale"],
    },
  }),
  ...[
    ["saber", 9308100, "剑之骑士"],
    ["archer", 9308110, "弓之骑士"],
    ["lancer", 9308120, "枪之骑士"],
    ["rider", 9308130, "骑乘兵"],
    ["caster", 9308140, "魔术师"],
    ["assassin", 9308150, "暗匿者"],
    ["berserker", 9308160, "狂战士"],
  ].map(([id, atlasId, name]) =>
    percentCe(`heroic-specter-${id}`, Number(atlasId), `英灵逢魔：${name}`, {
      mlbValue: 10,
      target: fsnTarget,
    }),
  ),
];

export const resolveCraftEssence = (
  craftEssence: BondCraftEssence,
  state: Exclude<CraftEssenceState, "none">,
): ResolvedBondCraftEssence => {
  const useMlb = state === "mlb";
  return {
    ...craftEssence,
    state,
    ownedValue: useMlb
      ? craftEssence.mlbOwnedValue
      : craftEssence.baseOwnedValue,
    supportValue: useMlb
      ? craftEssence.mlbSupportValue
      : craftEssence.baseSupportValue,
    secondaryBenefit: useMlb
      ? craftEssence.mlbSecondaryBenefit
      : craftEssence.baseSecondaryBenefit,
  };
};

export const DEFAULT_CRAFT_ESSENCE_STATES: Record<
  string,
  CraftEssenceState
> = {};

export const ALL_MLB_CRAFT_ESSENCE_STATES: Record<
  string,
  CraftEssenceState
> = Object.fromEntries(
  BOND_CRAFT_ESSENCES.map(({ id }) => [id, "mlb"]),
);
