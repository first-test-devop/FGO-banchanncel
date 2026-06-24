import { BOND_CRAFT_ESSENCES } from "./bondCraftEssences";
import servantsData from "./servants.json";

export const DATA_MANIFEST = {
  appVersion: "0.3.0",
  gameServer: "国服",
  dataVersion: "CN-2026-06-18",
  lastCheckedAt: "2026-06-24",
  sources: {
    servants:
      "Atlas Academy CN basic_servant.json + nice_servant.json export",
    craftEssences:
      "Atlas Academy CN nice_equip.json candidates + manually reviewed bond rules",
  },
  servants: {
    count: (servantsData as unknown[]).length,
    upstreamLastModified: "2026-06-18",
  },
  bondCraftEssences: {
    count: BOND_CRAFT_ESSENCES.length,
    reviewStatus: "manual-reviewed",
    lastReviewedAt: "2026-06-24",
  },
} as const;
