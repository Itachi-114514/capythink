'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RadarChart } from '@/components/RadarChart';
import { ScoreBars } from '@/components/ScoreBars';
import { BookList, type BookEntry } from '@/components/BookList';
import { DIM_META, type Dim, type QuizResult } from '@/lib/types';
import { typeImage } from '@/lib/type-images';
import { renderShareCard } from '@/lib/share-card';
import { RESULT_STORAGE_KEY } from '@/lib/storage';

interface StoredResult {
  result: QuizResult;
  recommendations: BookEntry[];
  savedAt: string;
}

export function ResultView() {
  const [data, setData] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RESULT_STORAGE_KEY);
      if (raw) setData(JSON.parse(raw) as StoredResult);
    } catch {
      setData(null);
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="wrap page">
        <p className="muted">正在读你上一次的结果…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wrap page">
        <div className="narrow">
          <div className="empty">
            这台设备上还没有结果。做一次测验，大约六分钟。
            <div className="mt-3">
              <Link href="/quiz" className="btn">
                开始测验
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { result, recommendations, savedAt } = data;
  const portrait = typeImage(result.typeLabel);
  const undetermined = (result.undetermined ?? []) as Dim[];
  const isUnformed =
    result.typeLabel === '还没定型的提问者' || result.typeLabel === '还在潜水的提问者';
  const confidenceLabel =
    result.typeConfidence === 'high' ? '高' : result.typeConfidence === 'medium' ? '中' : '低';
  const savedDate = new Date(savedAt);
  const dateLabel = Number.isNaN(savedDate.getTime())
    ? ''
    : new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(savedDate);

  function clear() {
    try {
      window.localStorage.removeItem(RESULT_STORAGE_KEY);
    } catch {
      // 忽略
    }
    setData(null);
  }

  async function saveShareImage() {
    if (sharing) return;
    setSharing(true);
    setShareNotice(null);

    try {
      const blob = await renderShareCard({
        result,
        recommendations,
        portraitSrc: portrait,
        host: window.location.host,
      });
      const filename = `capythink-${result.typeLabel}.png`;

      // Chromium 系浏览器支持「另存为」，可以自己选文件夹和文件名
      const picker = (
        window as unknown as {
          showSaveFilePicker?: (options: {
            suggestedName: string;
            types: { description: string; accept: Record<string, string[]> }[];
          }) => Promise<{
            name: string;
            createWritable: () => Promise<{
              write: (data: Blob) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }>;
        }
      ).showSaveFilePicker;

      if (picker) {
        try {
          const handle = await picker.call(window, {
            suggestedName: filename,
            types: [
              {
                description: '分享图（PNG）',
                accept: { 'image/png': ['.png'] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setShareNotice(`已保存：${handle.name}`);
          return;
        } catch (error) {
          if ((error as { name?: string })?.name === 'AbortError') return;
          // 其他情况退回普通下载
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareNotice('已下载到默认下载文件夹。');
    } catch {
      setShareNotice('生成失败，请再试一次。');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="wrap page">
      <div className="page-head">
        <div className={`result-head ${portrait ? 'has-portrait' : ''}`}>
          <div className="result-head-text">
            <div className="kicker">你的哲学状态 · 存在这台设备上</div>
            <h1>{result.typeLabel}</h1>
            {result.typeConfidence && !isUnformed ? (
              <div className="result-tags">
                <span className={`tag-confidence ${result.typeConfidence}`}>
                  {`把握：${confidenceLabel}`}
                </span>
                {result.runnerUp ? (
                  <span className="tag-soft">也很接近「{result.runnerUp.label}」</span>
                ) : null}
              </div>
            ) : null}
            <p className="lede">{result.portrait}</p>
            {result.typeConfidence === 'low' && !isUnformed ? (
              <p className="hint mt-2">
                前两维的差距落在误差范围内，这个标签只能算近似；往下看分数条会更准。
              </p>
            ) : null}
            {result.tension ? (
              <p className="notice mt-2" style={{ maxWidth: 720 }}>
                {result.tension}
              </p>
            ) : null}
            {undetermined.length ? (
              <p className="notice mt-2" style={{ maxWidth: 720 }}>
                你在{undetermined.map((dim) => DIM_META[dim].name).join('、')}
                上把题目全跳过了。这个方向上你还在潜水，暂时无法测出状态——不影响书单。
              </p>
            ) : null}
          </div>

          {portrait ? (
            <div className="result-portrait">
              <img src={portrait} alt={result.typeLabel} width={900} height={1200} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="radar-wrap">
          <RadarChart scores={result.scores} />
          <div>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <h3 className="mb-0" style={{ margin: 0 }}>
                六个方向
              </h3>
            </div>
            <ScoreBars
              scores={result.scores}
              undetermined={undetermined}
              stats={result.dimStats}
            />
            <p className="hint mt-3">
              -1 到 +1，0 是中间。浅色阴影是 ±1 个近似标准误；
              <Link href="/methods">怎么算的</Link>。
            </p>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-title">
          <span className="num">书单</span>
          <h2>按你现在的状态挑的</h2>
        </div>
        <p className="hint mb-3">
          {recommendations.length === 0
            ? '暂时没有新的书可以推荐——你在读和读完的书已经覆盖了这个范围。'
            : recommendations.length < 5
              ? `这次挑到 ${recommendations.length} 本（已经避开你在读和读完的书）。阅读难度按你选的「${result.readingLevel} 级」来配。`
              : `五本各有分工：顺着你的、补你短板的、站你对面的、入门锚点、换气的。阅读难度按你选的「${result.readingLevel} 级」来配。`}
        </p>
        <BookList items={recommendations} />
        <p className="mt-3">
          <Link href="/books" className="small">
            去书库看全部 240 本 →
          </Link>
        </p>
      </section>

      <section className="section">
        <div className="actions-row">
          <button type="button" className="btn" onClick={saveShareImage} disabled={sharing}>
            {sharing ? '生成中…' : '保存分享图'}
          </button>
          <Link href="/quiz" className="btn btn-ghost">
            重新测验
          </Link>
          <button type="button" className="btn btn-ghost" onClick={clear}>
            清除这份结果
          </button>
          <Link href="/me" className="small">
            我的记录
          </Link>
          <Link href="/" className="small">
            回到首页
          </Link>
        </div>
        {shareNotice ? <p className="hint mt-2">{shareNotice}</p> : null}
        <p className="hint mt-2">
          分享图是 1080×1440 的 PNG。Chrome / Edge 会弹出「另存为」，可以自己选文件夹和文件名；其他浏览器会下载到默认下载文件夹。
        </p>
        <p className="hint mt-2">
          {dateLabel ? `测于 ${dateLabel}。` : ''}
          这次结果已经存进<Link href="/me">我的记录</Link>，可以给书贴「准备读 / 正在读 / 已经读完」的标签。记录只存在这台设备上，换设备或清除站点数据就看不到了。
        </p>
      </section>
    </div>
  );
}
