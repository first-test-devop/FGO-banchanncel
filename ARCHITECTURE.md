# Architecture Decision Record

## ADR-001：Web 优先，领域层独立

- 状态：已采纳
- 日期：2026-06-22

### 背景

产品需要先快速验证六人阵容与羁绊礼装分析体验，未来可能接入微信小程序。规则会随着活动、服务器进度与礼装新增持续变化。

### 决策

首版采用 React + TypeScript + Vite 构建响应式 Web 应用。羁绊规则、类型和优化器保持为无 UI 框架依赖的纯 TypeScript 模块；游戏数据以版本化静态数据交付。

### 原因

- Web 迭代和分发成本低，适合验证产品。
- TypeScript 领域模块可被 Taro、原生小程序或服务端复用。
- 静态数据不依赖在线后端，首屏稳定且便于离线化。
- 规则与 UI 分离后，可单独测试计算正确性。

### 后果

- 接入小程序时需要新增适配层和小程序 UI，但无需重写分析器。
- 活动规则增加后，应把 `src/domain`、`src/data` 提升为 monorepo 共享包。
- Atlas Academy 图片目前走远端 CDN；正式商业发布前需要确认授权与缓存策略。

## ADR-002：使用可审计的穷举优化

- 状态：已采纳
- 日期：2026-06-22

阵容最多包含五名自有从者，候选羁绊礼装数量有限。优化器穷举 Cost 预算内、数量不超过自有槽位数的礼装子集，以整队总羁绊为第一目标、较低 Cost 为同分决胜条件。助战礼装作为用户输入的固定条件参与效果计算，不属于优化候选。若候选池未来显著增长，再替换为带容量约束的组合优化算法。

## ADR-003：助战配置固定，Cost 只约束自有编队

- 状态：已采纳
- 日期：2026-06-23

选择助战时同时记录助战从者、礼装与突破状态。领域层只优化五名自有从者的礼装；助战从者与助战礼装不计入玩家编队 Cost。若自有从者已超过 Cost 上限则拒绝分析；若剩余 Cost 不足以装备五张礼装，优化器允许输出空礼装位。

## ADR-004：以关卡模式描述冠位战多礼装槽

- 状态：已采纳
- 日期：2026-06-23

冠位身份属于本次编队而非从者静态数据。普通模式始终按单礼装槽计算；冠位战要求恰好一名自有冠位英灵，助战可独立标记为冠位。冠位英灵包含礼装位 1、固定自身羁绊礼装位 2、报酬提示礼装位 3，其中位 1 正常计算 Cost，位 2 与位 3 的 Cost 均为 0。领域层将位 1 与位 3 的羁绊效果一同纳入计算，但不会优化固定的位 2。

## ADR-005：数据更新采用“自动发现，人工确认”

### 背景

FGO 会持续新增从者和礼装。从者基础字段相对结构化，适合通过 Atlas Academy 导出自动生成；羁绊礼装则包含未满破 / 满破数值、助战特殊倍率、目标特性、固定值与特殊 Cost 规则，错误解析会直接导致推荐错误。

### 决策

保留 `src/data/servants.json` 为生成数据，新增 `src/data/dataManifest.ts` 记录数据版本、检查日期和审核状态。`scripts/check-data-update.mjs` 定期拉取 Atlas CN 导出，生成从者差异和疑似羁绊礼装候选报告；候选礼装必须人工确认后才能写入 `src/data/bondCraftEssences.ts`。GitHub Actions 每周运行数据新鲜度检查并上传报告。

### 影响

产品不会把未审核礼装规则直接暴露给用户计算，避免“自动但错误”的推荐。维护成本集中在候选确认阶段；后续可以在此基础上增加数据维护后台或自动开 issue。

## ADR-006：使用 GitHub Actions 发布 Direct Upload Pages 项目

### 背景

当前 Cloudflare Pages Beta 项目 `chaldea-bond-beta` 由 Wrangler Direct Upload 创建。Cloudflare Git 集成适合通过 Dashboard 的“Connect to Git”创建项目；Direct Upload 项目则更适合在 CI 中调用 Wrangler 发布预构建产物。

### 决策

新增 `.github/workflows/release.yml`。`main` 分支 push 后先执行 lint、test、build，再使用 `cloudflare/wrangler-action` 将 `dist` 部署到 Cloudflare Pages。Cloudflare 凭据通过 GitHub repository secrets 注入，不写入代码仓库。

### 影响

后续数据或功能更新只要推送到 `main`，在 GitHub Secrets 配置完成后即可自动发布。若 Secrets 缺失，workflow 会在部署前给出明确错误；本地 Wrangler Direct Upload 仍作为备用发布方式保留。
