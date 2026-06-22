export type SlotKind = "owned" | "support";

export interface Servant {
  id: number;
  collectionNo: number;
  name: string;
  className: string;
  rarity: number;
  face: string;
  bondEligible: boolean;
}

export interface PartySlot {
  kind: SlotKind;
  servant: Servant | null;
}

export interface BondCraftEssence {
  id: string;
  name: string;
  shortName: string;
  effect: "percent" | "flat";
  ownedValue: number;
  supportValue: number;
  image: string;
  secondaryBenefit?: string;
}

export interface BondSettings {
  baseBond: number;
  availableCeIds: string[];
}

export interface SlotRecommendation {
  slotIndex: number;
  servant: Servant;
  craftEssence: BondCraftEssence;
  reason: string;
  contributionPerServant: number;
  positionBonusPercent: number;
  finalBond: number | null;
  calculation: {
    baseBond: number;
    equipmentPercent: number;
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
  percentBonus: number;
  flatBonus: number;
  minServantBond: number;
  maxServantBond: number;
  supportInStartingLineup: boolean;
  activityPercent: number;
  notes: string[];
}
