import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SITE } from '@/site.config';

export const metadata: Metadata = {
  title: '卡皮思 CapyThink · 哲学趣味自测与书单',
  description:
    '30 条陈述，测出你此刻的哲学状态，拿到一张六维图和五本按状态挑的书。不用注册，不留邮箱，结果只存在你自己的浏览器里。',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <div className="wrap header-inner">
            <Link href="/" className="brand">
              <img
                src="/capybara.jpg"
                alt=""
                className="brand-avatar"
                width={32}
                height={32}
              />
              <span className="brand-text">
                <span className="brand-name">卡皮思</span>
                <span className="brand-sub">CapyThink</span>
              </span>
            </Link>
            <nav className="nav">
              <Link href="/quiz">开始测验</Link>
              <Link href="/books">书库</Link>
              <Link href="/me">我的</Link>
              <Link href="/privacy">隐私</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="wrap footer-inner">
            <div className="footer-links">
              <Link href="/methods">方法</Link>
              <Link href="/privacy">隐私</Link>
              <Link href="/terms">条款</Link>
            </div>
          </div>
          {SITE.icp || SITE.police ? (
            <div className="wrap footer-legal">
              {SITE.icp ? (
                <a href={SITE.icpUrl} target="_blank" rel="noreferrer">
                  {SITE.icp}
                </a>
              ) : null}
              {SITE.police ? (
                <a href={SITE.policeUrl} target="_blank" rel="noreferrer">
                  {SITE.police}
                </a>
              ) : null}
            </div>
          ) : null}
        </footer>
      </body>
    </html>
  );
}
