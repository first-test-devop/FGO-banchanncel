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
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};
