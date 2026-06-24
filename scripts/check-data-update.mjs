import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const ATLAS_EXPORTS = {
  basicServant: "https://api.atlasacademy.io/export/CN/basic_servant.json",
  niceServant: "https://api.atlasacademy.io/export/CN/nice_servant.json",
  niceEquip: "https://api.atlasacademy.io/export/CN/nice_equip.json",
};

const BOND_TEXT_PATTERN =
  /(羁绊|羈絆|牵绊|牽絆|絆|bond|friendship|servantFriendshipUp)/i;
const DEFAULT_OUT = path.join(projectRoot, "reports", "data-update-report.md");

const parseArgs = (argv) => {
  const args = {
    out: DEFAULT_OUT,
    remote: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];
    if (item === "--basic-servant") {
      args.basicServant = next;
      index += 1;
    } else if (item === "--nice-servant") {
      args.niceServant = next;
      index += 1;
    } else if (item === "--nice-equip") {
      args.niceEquip = next;
      index += 1;
    } else if (item === "--out") {
      args.out = next;
      index += 1;
    } else if (item === "--local-only") {
      args.remote = false;
    } else if (item === "--help") {
      args.help = true;
    }
  }

  return args;
};

const usage = () => `Usage:
  node scripts/check-data-update.mjs [options]

Options:
  --local-only                 Only summarize checked-in data; do not fetch Atlas exports.
  --basic-servant <path>       Use a downloaded CN basic_servant.json.
  --nice-servant <path>        Use a downloaded CN nice_servant.json.
  --nice-equip <path>          Use a downloaded CN nice_equip.json.
  --out <path>                 Write markdown report. Defaults to reports/data-update-report.md.

Without file arguments, the script downloads Atlas Academy CN exports and compares them with
the checked-in servant data and reviewed bond CE rules.
`;

const readJson = async (filePath) =>
  JSON.parse(await readFile(path.resolve(projectRoot, filePath), "utf8"));

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
};

const getRemoteJson = async (filePath, url, enabled) => {
  if (filePath) return readJson(filePath);
  if (!enabled) return null;
  return fetchJson(url);
};

const normalizeServants = (basicServants, niceServants = []) => {
  const costById = new Map(
    niceServants.map((item) => [Number(item.id), item.cost]),
  );

  return basicServants
    .filter((item) => item.type === "normal" && item.collectionNo > 0)
    .map((item) => ({
      id: Number(item.id),
      collectionNo: Number(item.collectionNo),
      name: item.name,
      className: item.className,
      rarity: item.rarity,
      cost: costById.get(Number(item.id)),
    }))
    .sort((a, b) => a.collectionNo - b.collectionNo);
};

const collectStrings = (value, bucket = []) => {
  if (typeof value === "string") {
    bucket.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, bucket));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, bucket));
  }
  return bucket;
};

const getReviewedCraftEssences = async () => {
  const source = await readFile(
    path.join(projectRoot, "src", "data", "bondCraftEssences.ts"),
    "utf8",
  );

  const atlasIds = [
    ...source.matchAll(/atlasId:\s*(\d+)/g),
    ...source.matchAll(/percentCe\([^,\n]+,\s*(\d+)/g),
  ].map((match) => Number(match[1]));

  const names = [
    ...source.matchAll(/percentCe\([^,\n]+,\s*\d+,\s*"([^"]+)"/g),
    ...source.matchAll(/name:\s*"([^"]+)"/g),
  ].map((match) => match[1]);

  return {
    atlasIds: new Set(atlasIds),
    names: new Set(names),
  };
};

const getEquipIdentity = (equip) => {
  const id = Number(equip.id ?? equip.collectionNo ?? equip.faceId);
  const name =
    equip.name ??
    equip.lName ??
    equip.detailName ??
    equip.collectionName ??
    `未命名礼装 ${Number.isFinite(id) ? id : ""}`.trim();
  return { id, name };
};

const summarizeText = (text) => {
  const compact = text.replace(/\s+/g, " ").trim();
  const index = compact.search(BOND_TEXT_PATTERN);
  if (index < 0) return compact.slice(0, 180);
  return compact.slice(Math.max(0, index - 60), index + 180);
};

const findBondCraftEssenceCandidates = async (niceEquip) => {
  const reviewed = await getReviewedCraftEssences();

  return niceEquip
    .map((equip) => {
      const { id, name } = getEquipIdentity(equip);
      const text = collectStrings(equip).join("\n");
      const knownById = reviewed.atlasIds.has(id);
      const knownByName = reviewed.names.has(name);
      return {
        id,
        name,
        cost: equip.cost,
        known: knownById || knownByName,
        excerpt: summarizeText(text),
        hasBondText: BOND_TEXT_PATTERN.test(text),
      };
    })
    .filter((item) => item.hasBondText)
    .sort((a, b) => Number(a.known) - Number(b.known) || a.id - b.id);
};

const table = (headers, rows) => {
  if (rows.length === 0) return "暂无。\n";
  return [
    `| ${headers.join(" |")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
  ].join("\n");
};

const buildReport = async ({ basicServants, niceServants, niceEquip }) => {
  const currentServants = await readJson("src/data/servants.json");
  const lines = [
    "# FGO 数据更新检查报告",
    "",
    `生成时间：${new Date().toISOString()}`,
    "",
    "## 数据源",
    "",
    `- 从者基础数据：${ATLAS_EXPORTS.basicServant}`,
    `- 从者详细数据：${ATLAS_EXPORTS.niceServant}`,
    `- 礼装详细数据：${ATLAS_EXPORTS.niceEquip}`,
    "",
    "## 当前已审核数据",
    "",
    `- 从者：${currentServants.length} 名`,
  ];

  if (!basicServants || !niceServants || !niceEquip) {
    lines.push(
      "",
      "本次以 `--local-only` 或缺少远程数据运行，仅输出本地数据摘要。",
      "",
    );
    return lines.join("\n");
  }

  const remoteServants = normalizeServants(basicServants, niceServants);
  const currentByCollectionNo = new Map(
    currentServants.map((item) => [item.collectionNo, item]),
  );
  const remoteByCollectionNo = new Map(
    remoteServants.map((item) => [item.collectionNo, item]),
  );

  const newServants = remoteServants.filter(
    (item) => !currentByCollectionNo.has(item.collectionNo),
  );
  const removedServants = currentServants.filter(
    (item) => !remoteByCollectionNo.has(item.collectionNo),
  );
  const changedCosts = remoteServants.filter((item) => {
    const current = currentByCollectionNo.get(item.collectionNo);
    return current && current.cost !== item.cost;
  });
  const missingRemoteCosts = remoteServants.filter(
    (item) => typeof item.cost !== "number",
  );
  const candidates = await findBondCraftEssenceCandidates(niceEquip);
  const pendingCandidates = candidates.filter((item) => !item.known);

  lines.push(
    "",
    "## 从者差异",
    "",
    `- 远程从者：${remoteServants.length} 名`,
    `- 新增从者：${newServants.length} 名`,
    `- 可能下架 / 过滤变化：${removedServants.length} 名`,
    `- Cost 变化：${changedCosts.length} 项`,
    `- 远程缺失 Cost：${missingRemoteCosts.length} 项`,
    "",
    "### 新增从者",
    "",
    table(
      ["图鉴", "ID", "名称", "职阶", "稀有度", "Cost"],
      newServants.slice(0, 40).map((item) => [
        item.collectionNo,
        item.id,
        item.name,
        item.className,
        item.rarity,
        item.cost ?? "待确认",
      ]),
    ),
    "### Cost 变化",
    "",
    table(
      ["图鉴", "名称", "当前", "远程"],
      changedCosts.slice(0, 40).map((item) => {
        const current = currentByCollectionNo.get(item.collectionNo);
        return [item.collectionNo, item.name, current?.cost, item.cost];
      }),
    ),
    "## 羁绊礼装候选",
    "",
    `- 远程疑似羁绊相关礼装：${candidates.length} 张`,
    `- 未纳入已审核规则的候选：${pendingCandidates.length} 张`,
    "",
    "这些候选不能直接进入正式计算。需要人工确认效果类型、未满破 / 满破数值、目标特性、助战特殊倍率与 Cost 后，再写入 `src/data/bondCraftEssences.ts`。",
    "",
    table(
      ["Atlas ID", "名称", "Cost", "状态", "相关描述摘录"],
      candidates.slice(0, 80).map((item) => [
        Number.isFinite(item.id) ? item.id : "未知",
        item.name,
        item.cost ?? "待确认",
        item.known ? "已审核" : "待确认",
        item.excerpt.replaceAll("|", "\\|"),
      ]),
    ),
    "",
    "## 建议动作",
    "",
    "1. 若有新增从者，运行 `pnpm data:generate-servants <basic_servant.json> src/data/servants.json <nice_servant.json>` 更新从者表。",
    "2. 对“待确认”的礼装候选逐条核对游戏内说明与 Atlas 原始效果。",
    "3. 将确认后的羁绊礼装规则写入 `src/data/bondCraftEssences.ts`，并补测试。",
    "4. 更新 `src/data/dataManifest.ts`、README 与 CHANGELOG 后发布新版本。",
    "",
  );

  return lines.join("\n");
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const [basicServants, niceServants, niceEquip] = await Promise.all([
    getRemoteJson(args.basicServant, ATLAS_EXPORTS.basicServant, args.remote),
    getRemoteJson(args.niceServant, ATLAS_EXPORTS.niceServant, args.remote),
    getRemoteJson(args.niceEquip, ATLAS_EXPORTS.niceEquip, args.remote),
  ]);

  const report = await buildReport({ basicServants, niceServants, niceEquip });
  const outPath = path.resolve(projectRoot, args.out);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${report}\n`);
  console.log(`Data update report written to ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
