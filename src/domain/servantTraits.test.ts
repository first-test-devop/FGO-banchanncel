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
  cost: 16,
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
      label: "拥有灵衣之人",
      description:
        "系统固定特性。即使你的账号尚未取得灵衣开放权、尚未开放或当前未穿着，也符合条件。",
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
