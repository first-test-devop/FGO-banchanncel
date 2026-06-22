import type { BondCraftEssence } from "../domain/types";

const atlasFace = (id: number) =>
  `https://static.atlasacademy.io/JP/Faces/f_${id}0.png`;

export const BOND_CRAFT_ESSENCES: BondCraftEssence[] = [
  {
    id: "chaldea-lunchtime",
    name: "迦勒底午餐时光",
    shortName: "午餐时光",
    effect: "percent",
    ownedValue: 10,
    supportValue: 10,
    image: atlasFace(9401970),
  },
  {
    id: "chaldea-teatime",
    name: "迦勒底午茶时光",
    shortName: "午茶时光",
    effect: "percent",
    ownedValue: 5,
    supportValue: 15,
    image: atlasFace(9403520),
  },
  {
    id: "detective-foumes",
    name: "名侦探芙尔摩斯",
    shortName: "芙尔摩斯",
    effect: "percent",
    ownedValue: 5,
    supportValue: 5,
    image: atlasFace(9403990),
    secondaryBenefit: "QP +5%",
  },
  {
    id: "chaldea-dinnertime",
    name: "迦勒底晚餐时光",
    shortName: "晚餐时光",
    effect: "percent",
    ownedValue: 5,
    supportValue: 5,
    image: atlasFace(9404180),
    secondaryBenefit: "御主经验 +5%",
  },
  {
    id: "gran-cavallo",
    name: "格兰·卡瓦洛",
    shortName: "格兰·卡瓦洛",
    effect: "percent",
    ownedValue: 5,
    supportValue: 5,
    image: atlasFace(9404360),
    secondaryBenefit: "魔术礼装经验 +5%",
  },
  {
    id: "beyond-the-snowy-night",
    name: "无雪之夜过后",
    shortName: "无雪之夜",
    effect: "percent",
    ownedValue: 5,
    supportValue: 5,
    image: atlasFace(9405170),
    secondaryBenefit: "助战友情点 +25",
  },
  {
    id: "heroic-spirit-portrait",
    name: "英灵肖像",
    shortName: "英灵肖像",
    effect: "flat",
    ownedValue: 50,
    supportValue: 50,
    image: atlasFace(9400970),
  },
  {
    id: "a-tale-of-wolves",
    name: "狼的故事",
    shortName: "狼的故事",
    effect: "percent",
    ownedValue: 2.5,
    supportValue: 2.5,
    image: atlasFace(9406010),
    secondaryBenefit: "QP +2.5%",
  },
];

export const DEFAULT_AVAILABLE_CE_IDS = BOND_CRAFT_ESSENCES.map(({ id }) => id);
