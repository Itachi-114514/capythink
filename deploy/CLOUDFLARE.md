# 卡皮思 · Cloudflare Pages 部署

Cloudflare 是境外托管，**不需要 ICP 备案**，也不要往页脚写备案号（`src/site.config.ts` 里的 `icp` 保持空）。

## 包里有什么

```
site/                 网站文件，部署时上传这个目录里的内容
deploy/CLOUDFLARE.md  本文件
deploy/DEPLOY.md      境内 Nginx 方案（用不到）
```

---

## 方式一：控制台上传（最简单）

1. 解压 `capythink-site-2026-10-20.zip`，进入 `site/` 文件夹。
2. 打开 <https://dash.cloudflare.com/> → **Workers & Pages** → **Create** → **Pages** → **Upload assets**。
3. 项目名填 `capythink`（小写）。
4. 把 `site/` **里面的内容**拖进上传区：`index.html`、`_next/`、`books/`、`me/`、`quiz/`、`result/`、`methods/`、`privacy/`、`terms/`、`types/`、`404.html`、`capybara.jpg`、`icon.png`。
   不要拖外层的 `capythink-site-2026-10-20` 文件夹。
5. 点 **Deploy**，得到 `https://capythink.pages.dev`。

打开检查：

```
/            /quiz/       /books/     /me/
/result/     /methods/    /privacy/   /terms/
```

再打开一个不存在的地址，应该显示 404 页面。

---

## 方式二：Wrangler 命令行

在本地项目根目录：

```powershell
npx wrangler pages deploy "dist\capythink-site-2026-10-20\site" --project-name capythink
```

第一次会打开浏览器让你登录 Cloudflare；之后每次更新只要重新构建、再跑一次。

如果还没建过项目，先：

```powershell
npx wrangler pages project create capythink
```

---

## 绑定自己的域名

1. 最好先把域名托管到 Cloudflare（在域名注册商处把 NS 改成 Cloudflare 给的两个地址）。
2. Pages 项目 → **Custom domains** → **Set up a custom domain** → 输入 `yourdomain.com`。
3. 如果域名已经在同一个 Cloudflare 账号下，DNS 会自动添加；等证书变成 **Active**（几分钟）。
4. 想同时支持 `www`，把 `www` 也加一遍，或在 Cloudflare 的 Redirect Rules 里做 301。

如果域名不在 Cloudflare：加一条 CNAME，`www` → `capythink.pages.dev`；裸域用 CNAME flattening 或直接 301 到 `www`。

---

## 注意

- **国内访问**：Cloudflare 免费版走境外节点，延迟 100–300ms，晚高峰会抖；`*.pages.dev` 有时被墙，绑定自己的域名会更稳。
- **不要放备案号**：境外托管没有备案，页脚写备案号反而奇怪。
- **抖音外链**：个人号基本不能挂站内链接，视频里也别硬放网址/二维码；用“搜「卡皮思」”这种软引导。
- **更新**：本地 `pnpm build`，重新上传 `out/` 或 `site/`，Pages 会生成新部署。
- **图片版权**：确认 `capybara.jpg` 有使用权。

---

## 和 Nginx 方案的区别

| | Cloudflare Pages | 境内 Nginx |
| --- | --- | --- |
| 备案 | 不需要 | 需要 |
| 服务器 | 不需要 | 需要一台云服务器 |
| 国内速度 | 慢/不稳 | 快 |
| 成本 | 免费 | 服务器 + 域名 |
| 上线速度 | 几分钟 | 备案周期 |
