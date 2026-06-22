import type { BondCraftEssence } from "../domain/types";

const atlasFace = (id: number) =>
  `https://static.atlasacademy.io/CN/Faces/f_${id}0.png`;

const percentCe = (
  id: string,
  atlasId: number,
  name: string,
  value: number,
  options: Partial<BondCraftEssence> = {},
): BondCraftEssence => ({
  id,
  name,
  shortName: name,
  effect: "percent",
  ownedValue: value,
  supportValue: value,
  image: atlasFace(atlasId),
  ...options,
});

const fsnTarget = {
  label: "Fate/stay night 从者",
  allTraits: ["FSNServant"],
};

export const BOND_CRAFT_ESSENCES: BondCraftEssence[] = [
  percentCe("chaldea-lunchtime", 9401970, "迦勒底午餐时光", 10),
  percentCe("chaldea-teatime", 9403520, "迦勒底午茶时光", 5, {
    supportValue: 15,
  }),
  percentCe("detective-foumes", 9403990, "名侦探芙尔摩斯", 5, {
    secondaryBenefit: "QP +5%",
  }),
  percentCe("chaldea-dinnertime", 9404180, "迦勒底晚餐时光", 5, {
    secondaryBenefit: "御主经验 +5%",
  }),
  percentCe("gran-cavallo", 9404360, "格兰·卡瓦洛", 5, {
    secondaryBenefit: "魔术礼装经验 +5%",
  }),
  percentCe("beyond-the-snowy-night", 9405170, "无雪之夜过后", 5, {
    secondaryBenefit: "助战友情点 +25",
  }),
  percentCe("a-tale-of-wolves", 9406010, "狼的故事", 2.5, {
    secondaryBenefit: "QP +2.5%",
  }),
  percentCe("toward-the-blue-sky", 9406200, "迎向碧空", 2.5, {
    secondaryBenefit: "御主经验 +2.5%",
  }),
  percentCe("dream-closet", 9406740, "梦想衣橱", 2.5, {
    secondaryBenefit: "魔术礼装经验 +2.5%",
  }),
  {
    id: "heroic-spirit-portrait",
    name: "英灵肖像",
    shortName: "英灵肖像",
    effect: "flat",
    ownedValue: 50,
    supportValue: 50,
    image: atlasFace(9400970),
  },
  percentCe("love-from-nff", 9407480, "来自ＮＦＦ的爱", 20, {
    target: {
      label: "兽科从者",
      allTraits: ["havingAnimalsCharacteristics"],
    },
  }),
  percentCe("chaldea-morning", 9407740, "迦勒底之晨", 20, {
    target: {
      label: "活在当下的人类",
      allTraits: ["livingHuman"],
    },
  }),
  percentCe("inspection-report", 9407850, "检查报告", 20, {
    target: {
      label: "秩序且善",
      allTraits: ["alignmentLawful", "alignmentGood"],
    },
  }),
  percentCe("wings-of-the-manuscript", 9408060, "手稿之翼", 20, {
    target: {
      label: "术阶从者",
      classNames: ["caster"],
    },
  }),
  percentCe("secret-mission", 9408220, "秘密任务", 20, {
    target: {
      label: "骑阶从者",
      classNames: ["rider"],
    },
  }),
  percentCe("a-sincere-stitch", 9408390, "至诚的一针", 20, {
    target: {
      label: "拥有灵衣的从者",
      allTraits: ["hasCostume"],
    },
  }),
  percentCe("bride-for-happiness", 9408590, "献给幸福的新娘", 20, {
    target: {
      label: "秩序的女性",
      allTraits: ["alignmentLawful", "genderFemale"],
    },
  }),
  percentCe("heroic-specter-saber", 9308100, "英灵逢魔：剑之骑士", 10, {
    target: fsnTarget,
  }),
  percentCe("heroic-specter-archer", 9308110, "英灵逢魔：弓之骑士", 10, {
    target: fsnTarget,
  }),
  percentCe("heroic-specter-lancer", 9308120, "英灵逢魔：枪之骑士", 10, {
    target: fsnTarget,
  }),
  percentCe("heroic-specter-rider", 9308130, "英灵逢魔：骑乘兵", 10, {
    target: fsnTarget,
  }),
  percentCe("heroic-specter-caster", 9308140, "英灵逢魔：魔术师", 10, {
    target: fsnTarget,
  }),
  percentCe("heroic-specter-assassin", 9308150, "英灵逢魔：暗匿者", 10, {
    target: fsnTarget,
  }),
  percentCe("heroic-specter-berserker", 9308160, "英灵逢魔：狂战士", 10, {
    target: fsnTarget,
  }),
];

export const DEFAULT_AVAILABLE_CE_IDS = BOND_CRAFT_ESSENCES.map(({ id }) => id);
