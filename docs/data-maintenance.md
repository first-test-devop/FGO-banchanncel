# 数据维护与发布流程

Chaldea Bond 的计算结果依赖两类数据：

1. 从者数据：名字、职阶、稀有度、Cost、特性等。
2. 羁绊礼装规则：是否加羁绊、百分比或固定值、未满破 / 满破数值、目标特性、助战特殊倍率、Cost 等。

从者数据可以高度自动化；羁绊礼装规则必须经过人工确认后才能进入正式计算。

## 数据源

- 国服从者基础数据：`https://api.atlasacademy.io/export/CN/basic_servant.json`
- 国服从者详细数据：`https://api.atlasacademy.io/export/CN/nice_servant.json`
- 国服礼装详细数据：`https://api.atlasacademy.io/export/CN/nice_equip.json`

## 为什么礼装不能直接全自动入库

Atlas 能提供礼装原始数据，但产品需要的是可计算规则。例如“羁绊获得量提升”“助战时额外提升”“仅限秩序·善”“拥有灵衣之人”等，需要映射成领域模型中的 `effect`、`baseOwnedValue`、`mlbOwnedValue`、`baseSupportValue`、`mlbSupportValue` 与 `target`。

如果这一步完全由脚本猜测，一旦把目标特性、满破数值或助战特殊倍率解析错，分析器会给出错误推荐。因此长期策略是：

- 自动发现疑似羁绊礼装候选；
- 自动生成差异报告；
- 人工确认规则；
- 补测试后发布。

## 每周自动检查

`.github/workflows/data-freshness.yml` 每周一运行，也可以在 GitHub Actions 手动触发。它会：

1. 拉取 Atlas CN 导出数据；
2. 对比当前 `src/data/servants.json`；
3. 扫描 `nice_equip.json` 中疑似羁绊相关的礼装；
4. 生成 `data-update-report.md` 并上传为 workflow artifact。

本地也可以运行：

```bash
pnpm data:check
```

只看本地数据摘要，不联网：

```bash
pnpm data:check -- --local-only
```

## 新增从者更新流程

1. 下载最新国服 `basic_servant.json` 与 `nice_servant.json`。
2. 运行：

   ```bash
   pnpm data:generate-servants /path/to/basic_servant.json src/data/servants.json /path/to/nice_servant.json
   ```

3. 检查 git diff，确认新增从者、Cost 与特性正常。
4. 更新 `src/data/dataManifest.ts` 中的数据版本和检查日期。
5. 运行 `pnpm lint && pnpm test && pnpm build`。
6. 更新 README / CHANGELOG 后发布。

## 新增羁绊礼装确认流程

1. 查看 `pnpm data:check` 生成的“羁绊礼装候选”。
2. 对每张“待确认”候选核对：
   - 礼装名称与 Atlas ID；
   - Cost；
   - 是百分比还是固定值；
   - 未满破与满破羁绊数值；
   - 自有装备与助战装备是否不同；
   - 是否有目标特性或职阶限制；
   - 是否有类似冠位战 Cost 的特殊说明。
3. 将确认后的规则写入 `src/data/bondCraftEssences.ts`。
4. 为新规则补充领域测试，尤其是特性命中、助战特殊倍率与 Cost 约束。
5. 更新 `src/data/dataManifest.ts`、README、CHANGELOG。

## 发布原则

- 未确认的礼装候选不得进入正式推荐。
- 数据版本必须显示在页面上，避免用户误以为数据实时自动同步。
- 每次数据发布都应有单独提交或版本说明。
- 如果数据规则来自游戏内说明，应在提交说明或维护记录中标明确认依据。
