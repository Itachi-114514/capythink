import Link from 'next/link';
import { Capybara } from '@/components/Capybara';

export function Home() {
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <div className="kicker">哲学趣味自测</div>
          <h1>
            先弄清楚，
            <br />
            你此刻站在哪儿。
          </h1>
          <p className="lede">
            30 条陈述，六个维度。做完给你一张状态图、一段画像，和五本按你现在的状态挑的书。没有标准答案，也没有「更好」的立场。
          </p>
          <div className="hero-actions">
            <Link href="/quiz" className="btn">
              开始测验
            </Link>
            <Link href="/privacy" className="btn btn-ghost">
              我们收集什么
            </Link>
          </div>
          <p className="hero-note">
            不用注册 · 不留邮箱 · 结果只存在你自己的浏览器里
            <span className="muted">　·　</span>
            <Link href="/books">逛逛书库</Link>
          </p>
        </div>

        <div className="hero-art" aria-hidden="true">
          <Capybara />
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <span className="num">01</span>
          <h2>三步，大约六分钟</h2>
        </div>
        <div className="grid-3">
          <div className="step">
            <div className="step-num">第一步</div>
            <h3>答 30 条</h3>
            <p>四点选择，没有中间项。太难的题可以跳过，跳过不计分，也不影响其他维度。</p>
          </div>
          <div className="step">
            <div className="step-num">第二步</div>
            <h3>看状态</h3>
            <p>六维分数、一段文字画像，还有你身上互相拉扯的地方。它是描述，不是诊断。</p>
          </div>
          <div className="step">
            <div className="step-num">第三步</div>
            <h3>拿书单</h3>
            <p>五本书各管一件事：顺着你、补短板、站对面、入门锚点、换气。难度按你的阅读经验配。</p>
          </div>
        </div>
      </section>
    </div>
  );
}
