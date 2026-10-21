# 卡皮思 · 服务器部署清单

> 这是**境内 Nginx** 方案。用 Cloudflare Pages 的话看同目录的 `CLOUDFLARE.md`：不需要 Nginx，也不需要备案。

这个包是**纯静态站点**，服务器上只需要 Nginx，不需要 Node、不需要数据库。

## 包里有什么

```
capythink-site-2026-10-20/
  site/                 静态站点（就是本地 out/ 的内容）
  deploy/nginx.conf     Nginx 配置模板
  deploy/DEPLOY.md      本文件
```

---

## 0. 上线前先确认

1. **备案**：境内服务器必须等 ICP 备案通过后再开放 80/443；备案期间网站要关。
2. **备案号 / 联系邮箱**：在本地 `src/site.config.ts` 里填：

   ```ts
   icp: '京ICP备2026000000号-1',
   police: '', // 公安备案号，没有就留空
   contactEmail: 'hello@yourdomain.com',
   ```

   然后 `pnpm build` 重新打包。当前包是**占位版**：页脚不显示备案号，隐私页写的是“不收集个人信息”，联系邮箱留空。
3. **图片版权**：确认 `capybara.jpg` 是你有权使用的图。

---

## 1. 上传

本地 Windows / macOS / Linux 都可以用 scp：

```bash
scp capythink-site-2026-10-20.tar.gz root@服务器IP:/tmp/
```

登录服务器：

```bash
ssh root@服务器IP
cd /tmp
tar -xzf capythink-site-2026-10-20.tar.gz

mkdir -p /var/www/capythink
rsync -av --delete /tmp/capythink-site-2026-10-20/site/ /var/www/capythink/
chown -R www-data:www-data /var/www/capythink
chmod -R u=rwX,go=rX /var/www/capythink
```

确认首页在位：

```bash
ls /var/www/capythink/index.html
```

---

## 2. 装 Nginx

> 下面按 Ubuntu / Debian 写。CentOS / Alibaba Cloud Linux 把 `apt install` 换成 `dnf install`，配置文件放 `/etc/nginx/conf.d/capythink.conf`，不建 `sites-available` 软链。
>
> 云服务器还要在控制台安全组放行 **80** 和 **443**。

```bash
apt update
apt install -y nginx
```

复制配置并改域名：

```bash
cp /tmp/capythink-site-2026-10-20/deploy/nginx.conf /etc/nginx/sites-available/capythink
nano /etc/nginx/sites-available/capythink
# 把 server_name 改成你的域名；root 保持 /var/www/capythink

ln -sf /etc/nginx/sites-available/capythink /etc/nginx/sites-enabled/capythink
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 3. 上 HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

CentOS / Alibaba Cloud Linux 用 `dnf install certbot python3-certbot-nginx`；如果源里没有，按 certbot 官网的 snap 方式装。

certbot 会自动改 Nginx 配置并续期。之后访问 `https://yourdomain.com`。

---

## 4. 验收

在本地跑一遍：

```bash
for p in / /quiz/ /result/ /books/ /me/ /methods/ /privacy/ /terms/; do
  curl -s -o /dev/null -w "%{http_code}  $p\n" "https://yourdomain.com$p"
done
```

应该全部 `200`。再检查：

- `https://yourdomain.com/nope` 返回 404 页面
- 手机打开答题、书库筛选、我的记录都正常
- 页脚能看到备案号（填了的话）

---

## 5. 以后更新

本地：

```bash
pnpm build
```

把新的 `out/` 同步上去：

```bash
scp -r out/* root@服务器IP:/var/www/capythink/
```

或者重新打包，重复第 1 步。静态文件没有缓存依赖，覆盖即可。

---

## 常见问题

**403 Forbidden**
目录权限不对，或 `index.html` 不在 `/var/www/capythink/index.html`。

**子页面 404**
确认 Nginx 里是 `try_files $uri $uri/ =404;`，并且 `out/quiz/index.html` 这类目录结构完整。

**改了备案号没生效**
`src/site.config.ts` 改完后必须重新 `pnpm build`，只改源码不会影响已上传的静态文件。

**想用 Cloudflare**
这个包也能直接传到 Cloudflare Pages（Workers & Pages → Upload assets → 选 `site/`）。但 Cloudflare 是境外托管，不要和境内备案混用，国内访问也会慢。
