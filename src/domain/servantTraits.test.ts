import { describe, expect, it } from "vitest";
import {
  getMatchedTargetLabels,
  getServantBondTraits,
} from "./servantTraits";
import type { Servant } from "./types";

const servant = (traits: string[]): Servant => ({
  id: 1,
  collectionNo: 1,
  name: "测试英灵",
  className: "saber",
  rarity: 5,
  face: "",
  bondEligible: true,
  traits,
});

describe("servant bond traits", () => {
  it("explains that costume eligibility does not depend on player ownership", () => {
    const costume = getServantBondTraits(servant(["hasCostume"])).find(
      ({ id }) => id === "hasCostume",
    );

    expect(costume).toMatchObject({
      label: "有可开放灵衣",
      description:
        "表示该英灵在游戏中存在可开放的灵衣，不要求你的账号已解锁，也不要求当前穿着。",
    });
  });

  it("returns the exact matched conditions for compound targets", () => {
    expect(
      getMatchedTargetLabels(
        servant(["alignmentLawful", "alignmentGood"]),
        {
          label: "秩序且善",
          allTraits: ["alignmentLawful", "alignmentGood"],
        },
      ),
    ).toEqual(["秩序", "善"]);
  });
});
