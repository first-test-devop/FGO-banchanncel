import type { PartySlot } from "./types";

export const reorderParty = (
  party: PartySlot[],
  fromIndex: number,
  toIndex: number,
) => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= party.length ||
    toIndex >= party.length
  ) {
    return party;
  }

  const next = [...party];
  [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
  return next;
};
