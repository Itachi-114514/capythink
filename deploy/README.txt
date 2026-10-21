卡皮思 · CapyThink 静态站
=======================

- site/                 网站文件
- deploy/CLOUDFLARE.md  部署到 Cloudflare Pages（不用备案，推荐）
- deploy/DEPLOY.md      部署到境内 Nginx（需要备案）
- deploy/nginx.conf     境内 Nginx 配置模板

先看你要用哪种：
  Cloudflare → deploy/CLOUDFLARE.md
  境内服务器 → deploy/DEPLOY.md

注意：Cloudflare 是境外托管，页脚不要写备案号（src/site.config.ts 的 icp 留空）。
