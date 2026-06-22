import { readFile, writeFile } from "node:fs/promises";

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  throw new Error(
    "Usage: node scripts/generate-servants.mjs <basic_servant.json> <output.json>",
  );
}

const raw = JSON.parse(await readFile(source, "utf8"));
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
    face: item.face,
    bondEligible: item.collectionNo !== 1,
  }))
  .sort((left, right) => left.collectionNo - right.collectionNo);

await writeFile(destination, `${JSON.stringify(servants, null, 2)}\n`);
console.log(`Generated ${servants.length} servants at ${destination}`);
