export type SlotKind = "owned" | "support";
export type CraftEssenceState = "none" | "base" | "mlb";

export interface Servant {
  id: number;
  collectionNo: number;
  name: string;
  className: string;
  rarity: number;
  cost: number;
  face: string;
  bondEligible: boolean;
  traits: string[];
}

export interface PartySlot {
  kind: SlotKind;
  servant: Servant | null;
  supportCraftEssence?: {
    id: string | null;
    state: Exclude<CraftEssenceState, "none">;
  } | null;
}

export interface BondCraftEssence {
  id: string;
  name: string;
  shortName: string;
  effect: "percent" | "flat";
  baseOwnedValue: number;
  mlbOwnedValue: number;
  baseSupportValue: number;
  mlbSupportValue: number;
  hasMlbEffect: boolean;
  cost: number;
  image: string;
  isEmpty?: boolean;
  baseSecondaryBenefit?: string;
  mlbSecondaryBenefit?: string;
  target?: {
    label: string;
    allTraits?: string[];
    classNames?: string[];
  };
}

export interface ResolvedBondCraftEssence extends BondCraftEssence {
  state: Exclude<CraftEssenceState, "none">;
  ownedValue: number;
  supportValue: number;
  secondaryBenefit?: string;
}

export interface BondSettings {
  baseBond: number;
  maxPartyCost: number;
  craftEssenceStates: Record<string, CraftEssenceState>;
}

export interface SlotRecommendation {
  slotIndex: number;
  servant: Servant;
  craftEssence: ResolvedBondCraftEssence;
  reason: string;
  servantTraits: {
    id: string;
    label: string;
    description?: string;
  }[];
  matchedBeneficiaries: {
    servantId: number;
    servantName: string;
    matchedTraits: string[];
  }[];
  contributionPerServant: number;
  positionBonusPercent: number;
  finalBond: number | null;
  calculation: {
    baseBond: number;
    equipmentPercent: number;
    equipmentBreakdown: {
      name: string;
      value: number;
      state: Exclude<CraftEssenceState, "none">;
      stateLabel: string;
    }[];
    activityPercent: number;
    afterEquipment: number;
    startingMemberPercent: number;
    supportSharePercent: number;
    afterPosition: number;
    fixedBonus: number;
    finalBond: number;
  } | null;
}

export interface BondAnalysis {
  recommendations: SlotRecommendation[];
  baseTotal: number;
  totalPartyBond: number;
  eligibleServantCount: number;
  minEquipmentPercent: number;
  maxEquipmentPercent: number;
  flatBonus: number;
  minServantBond: number;
  maxServantBond: number;
  supportInStartingLineup: boolean;
  activityPercent: number;
  maxPartyCost: number;
  partyCost: number;
  servantCost: number;
  craftEssenceCost: number;
  remainingCost: number;
  notes: string[];
}
