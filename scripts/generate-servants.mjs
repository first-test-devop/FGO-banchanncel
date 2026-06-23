import { readFile, writeFile } from "node:fs/promises";

const [source, destination, niceSource] = process.argv.slice(2);
if (!source || !destination || !niceSource) {
  throw new Error(
    "Usage: node scripts/generate-servants.mjs <basic_servant.json> <output.json> <nice_servant.json>",
  );
}

const raw = JSON.parse(await readFile(source, "utf8"));
const nice = JSON.parse(await readFile(niceSource, "utf8"));
const costById = new Map(nice.map((item) => [item.id, item.cost]));
const servants = raw
  .filter(
    (item) =>
      item.collectionNo > 0 &&
      item.face &&
      item.traits?.some((trait) => trait.name === "canBeInBattle"),
  )
  .map((item) => ({
    id: item.id,
    collectionNo: item.collectionNo,
    name: item.name,
    className: item.className,
    rarity: item.rarity,
    cost: costById.get(item.id),
    face: item.face,
    bondEligible: item.collectionNo !== 1,
    traits: item.traits.map((trait) => trait.name),
  }))
  .sort((left, right) => left.collectionNo - right.collectionNo);

const missingCost = servants.find(({ cost }) => typeof cost !== "number");
if (missingCost) {
  throw new Error(`Missing Cost for servant ${missingCost.id}`);
}

await writeFile(destination, `${JSON.stringify(servants, null, 2)}\n`);
console.log(`Generated ${servants.length} servants at ${destination}`);
