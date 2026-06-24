# 部署与自动发布

当前 Beta 站点部署在 Cloudflare Pages：

- 项目名：`chaldea-bond-beta`
- 生产地址：<https://chaldea-bond-beta.pages.dev>
- 部署模式：Direct Upload + GitHub Actions

## 自动发布流程

`.github/workflows/release.yml` 会在 `main` 分支有新提交时自动运行：

1. 安装依赖；
2. 执行 `pnpm lint`；
3. 执行 `pnpm test`；
4. 执行 `pnpm build`；
5. 将 `dist` 发布到 Cloudflare Pages。

也可以在 GitHub Actions 页面手动触发 `Release` workflow。

## 必需的 GitHub Secrets

根据 Cloudflare Pages Direct Upload 的 CI 文档，GitHub Actions 需要两个仓库 Secret：

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

当前 Cloudflare Account ID：

```text
5f496b5922446753b19a5733e2512b58
```

API Token 需要在 Cloudflare Dashboard 创建，权限选择：

- Account
- Cloudflare Pages
- Edit

然后在 GitHub 仓库中添加：

1. 进入 GitHub 仓库；
2. 打开 Settings；
3. 进入 Secrets and variables > Actions；
4. 新增 `CLOUDFLARE_ACCOUNT_ID`；
5. 新增 `CLOUDFLARE_API_TOKEN`。

Secret 配好后，每次 push 到 `main` 都会自动发布。Secret 尚未配置时，workflow 仍会运行 lint / test / build，但会跳过部署步骤并给出 warning。

## 本地手动部署备用命令

如果 GitHub Actions 或 Cloudflare 临时不可用，可以继续使用本地直传：

```bash
pnpm build
pnpm dlx wrangler pages deploy dist --project-name chaldea-bond-beta --branch main
```
