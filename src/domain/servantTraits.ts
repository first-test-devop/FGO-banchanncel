import type { BondCraftEssence, Servant } from "./types";

export interface DisplayTrait {
  id: string;
  label: string;
  description?: string;
}

const CLASS_LABELS: Record<string, string> = {
  saber: "剑阶",
  archer: "弓阶",
  lancer: "枪阶",
  rider: "骑阶",
  caster: "术阶",
  assassin: "杀阶",
  berserker: "狂阶",
  shielder: "盾阶",
  ruler: "裁阶",
  avenger: "仇阶",
  alterEgo: "他人格",
  moonCancer: "月癌",
  foreigner: "降临者",
  pretender: "伪装者",
  beast: "兽阶",
};

const TRAIT_LABELS: Record<string, DisplayTrait> = {
  alignmentLawful: { id: "alignmentLawful", label: "秩序" },
  alignmentChaotic: { id: "alignmentChaotic", label: "混沌" },
  alignmentNeutral: { id: "alignmentNeutral", label: "中立" },
  alignmentGood: { id: "alignmentGood", label: "善" },
  alignmentEvil: { id: "alignmentEvil", label: "恶" },
  alignmentBalanced: { id: "alignmentBalanced", label: "中庸" },
  alignmentMadness: { id: "alignmentMadness", label: "狂" },
  alignmentSummer: { id: "alignmentSummer", label: "夏" },
  genderFemale: { id: "genderFemale", label: "女性" },
  genderMale: { id: "genderMale", label: "男性" },
  genderUnknown: { id: "genderUnknown", label: "性别不明" },
  havingAnimalsCharacteristics: {
    id: "havingAnimalsCharacteristics",
    label: "兽科",
  },
  livingHuman: {
    id: "livingHuman",
    label: "活在当下的人类",
  },
  hasCostume: {
    id: "hasCostume",
    label: "有可开放灵衣",
    description:
      "表示该英灵在游戏中存在可开放的灵衣，不要求你的账号已解锁，也不要求当前穿着。",
  },
  FSNServant: {
    id: "FSNServant",
    label: "Fate/stay night 从者",
  },
};

const BOND_RELEVANT_TRAITS = new Set(Object.keys(TRAIT_LABELS));

export const getClassLabel = (className: string) =>
  CLASS_LABELS[className] ?? className;

export const getServantBondTraits = (servant: Servant): DisplayTrait[] => [
  {
    id: `class:${servant.className}`,
    label: getClassLabel(servant.className),
  },
  ...servant.traits
    .filter((trait) => BOND_RELEVANT_TRAITS.has(trait))
    .map((trait) => TRAIT_LABELS[trait]),
];

export const getTargetRequirementLabels = (
  target: NonNullable<BondCraftEssence["target"]>,
) => [
  ...(target.classNames ?? []).map(
    (className) => `职阶：${getClassLabel(className)}`,
  ),
  ...(target.allTraits ?? []).map(
    (trait) => TRAIT_LABELS[trait]?.label ?? trait,
  ),
];

export const getMatchedTargetLabels = (
  servant: Servant,
  target: NonNullable<BondCraftEssence["target"]>,
) => {
  const matchesTraits =
    !target.allTraits ||
    target.allTraits.every((trait) => servant.traits.includes(trait));
  const matchesClass =
    !target.classNames || target.classNames.includes(servant.className);
  return matchesTraits && matchesClass
    ? getTargetRequirementLabels(target)
    : [];
};
