'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { HistoryTrend } from '@/components/HistoryTrend';
import { NoteTimeline } from '@/components/NoteTimeline';
import { ReadingStats } from '@/components/ReadingStats';
import {
  SHELF_STATUS_OPTIONS,
  ShelfStatusControl,
} from '@/components/ShelfStatusControl';
import type { Book } from '@/lib/types';
import { typeImage } from '@/lib/type-images';
import {
  clearArchive,
  exportArchive,
  importArchive,
  migrateLegacyResult,
  readHistory,
  readShelf,
  setBookFinishedAt,
  setBookNote,
  setBookStatus,
  type Attempt,
  type Shelf,
  type ShelfStatus,
} from '@/lib/archive';

const CONFIDENCE_LABEL = { high: '高', medium: '中', low: '低' } as const;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function AttemptThumb({ label }: { label: string }) {
  const src = typeImage(label);
  return src ? <img className="attempt-thumb" src={src} alt="" /> : null;
}

function NoteEditor({
  book,
  note,
  onSave,
}: {
  book: Book;
  note: string;
  onSave: (book: Book, note: string) => void;
}) {
  const [value, setValue] = useState(note);

  useEffect(() => {
    setValue(note);
  }, [note]);

  return (
    <textarea
      className="shelf-note"
      rows={2}
      value={value}
      maxLength={120}
      placeholder="一句话感想…"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onSave(book, value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export function ArchiveView() {
  const [history, setHistory] = useState<Attempt[]>([]);
  const [shelf, setShelf] = useState<Shelf>({});
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    migrateLegacyResult();
    setHistory(readHistory());
    setShelf(readShelf());
    setReady(true);
  }, []);

  function updateStatus(book: Book, status: ShelfStatus | null) {
    setShelf(setBookStatus(book, status));
  }

  function updateNote(book: Book, note: string) {
    setShelf(setBookNote(book, note));
  }

  function updateFinishedAt(book: Book, date: string) {
    setShelf(setBookFinishedAt(book, date));
  }

  async function exportBackup() {
    const json = exportArchive();
    const filename = `capythink-backup-${new Date().toISOString().slice(0, 10)}.json`;

    // Chromium 系浏览器支持「另存为」对话框，可以自己选文件夹和文件名
    const picker = (
      window as unknown as {
        showSaveFilePicker?: (options: {
          suggestedName: string;
          types: { description: string; accept: Record<string, string[]> }[];
        }) => Promise<{
          name: string;
          createWritable: () => Promise<{
            write: (data: string) => Promise<void>;
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
              description: '卡皮思备份（JSON）',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        setNotice({ type: 'success', text: `已保存：${handle.name}` });
        return;
      } catch (error) {
        // 用户点了取消，不算失败
        if (
          error &&
          typeof error === 'object' &&
          (error as { name?: string }).name === 'AbortError'
        ) {
          return;
        }
        // 其他情况退回普通下载
      }
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice({
      type: 'success',
      text: '浏览器已下载到默认下载文件夹。想自己选位置，用 Chrome / Edge 会弹出「另存为」。',
    });
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!window.confirm('导入会覆盖这台设备上现有的记录和书架，继续吗？')) return;

    const result = importArchive(await file.text());
    if (!result.ok) {
      setNotice({ type: 'error', text: result.error });
      return;
    }

    setHistory(readHistory());
    setShelf(readShelf());
    setNotice({
      type: 'success',
      text: `导入完成：${result.history} 条记录，${result.shelf} 本书。`,
    });
  }

  function clearAll() {
    if (!window.confirm('清除所有测验记录和书架标签？这个动作不能撤销。')) return;
    clearArchive();
    setHistory([]);
    setShelf({});
  }

  if (!ready) {
    return (
      <div className="wrap page">
        <p className="muted">正在读本机记录…</p>
      </div>
    );
  }

  const counts: Record<ShelfStatus, number> = { planned: 0, reading: 0, done: 0 };
  const shelfEntries = Object.values(shelf).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  for (const entry of shelfEntries) counts[entry.status] += 1;
  const empty = history.length === 0 && shelfEntries.length === 0;

  return (
    <div className="wrap page">
      <div className="page-head">
        <div className="kicker">我的记录 · 只在这台设备上</div>
        <h1>我的哲学档案</h1>
        <p className="lede">
          做过 {history.length} 次测验。书架上有 {counts.planned} 本想读、{counts.reading} 本在读、
          {counts.done} 本读完。
        </p>
      </div>

      <section className="backup-panel">
        <div>
          <div className="backup-title">备份与恢复</div>
          <p className="hint">
            换设备或清缓存前先存一份。Chrome / Edge 会弹出「另存为」，可以自己选文件夹和文件名；其他浏览器会下载到默认下载文件夹。导入会覆盖这台设备上现有的记录。
          </p>
        </div>
        <div className="backup-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={exportBackup}
            disabled={empty}
          >
            导出备份
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            导入备份
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={importBackup}
          />
        </div>
      </section>

      {notice ? (
        <p className={notice.type === 'error' ? 'error mt-2' : 'success mt-2'}>
          {notice.text}
        </p>
      ) : null}

      {empty ? (
        <div className="empty">
          还没有记录。做一次测验，结果和书单会自动留在这里。
          <div className="mt-3">
            <Link href="/quiz" className="btn">
              开始测验
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="section">
            <div className="section-title">
              <span className="num">书架</span>
              <h2>你贴过标签的书</h2>
            </div>
            <div className="shelf-board">
              {SHELF_STATUS_OPTIONS.map((option) => {
                const items = shelfEntries.filter((entry) => entry.status === option.key);
                return (
                  <div className="shelf-col" key={option.key}>
                    <div className="shelf-col-head">
                      <h3>{option.label}</h3>
                      <span>{items.length}</span>
                    </div>
                    {items.length ? (
                      items.map((entry) => (
                        <div className="shelf-item" key={entry.book.id}>
                          <div className="shelf-book">《{entry.book.title}》</div>
                          <div className="shelf-author">{entry.book.author}</div>
                          <ShelfStatusControl
                            book={entry.book}
                            status={entry.status}
                            onChange={updateStatus}
                            compact
                          />
                          <div className="shelf-log">
                            {entry.status === 'done' ? (
                              <label className="shelf-date">
                                <span>读完</span>
                                <input
                                  type="date"
                                  value={entry.finishedAt ?? ''}
                                  onChange={(event) =>
                                    updateFinishedAt(entry.book, event.target.value)
                                  }
                                />
                              </label>
                            ) : null}
                            <NoteEditor
                              book={entry.book}
                              note={entry.note ?? ''}
                              onSave={updateNote}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="hint">还没有。</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="hint mt-3">
              贴过标签的书（准备读、正在读、已经读完），下次测验都不会再推荐。再点一次当前标签可以取消，取消后会重新进入候选。
            </p>
          </section>

          <ReadingStats shelf={shelf} />
          <NoteTimeline shelf={shelf} />
          <HistoryTrend attempts={history} />

          <section className="section">
            <div className="section-title">
              <span className="num">记录</span>
              <h2>每次测验</h2>
            </div>
            <div className="attempt-list">
              {history.map((attempt) => (
                <article className="attempt" key={attempt.id}>
                  <div className="attempt-head">
                    <div className="attempt-head-main">
                      <AttemptThumb label={attempt.result.typeLabel} />
                      <div>
                        <div className="attempt-date">{formatDate(attempt.savedAt)}</div>
                        <div className="attempt-type">{attempt.result.typeLabel}</div>
                      </div>
                    </div>
                    {attempt.result.typeConfidence ? (
                      <span className={`tag-confidence ${attempt.result.typeConfidence}`}>
                        {`把握：${CONFIDENCE_LABEL[attempt.result.typeConfidence]}`}
                      </span>
                    ) : null}
                  </div>
                  <div className="attempt-books">
                    {attempt.recommendations.map((rec) => (
                      <div className="attempt-book" key={rec.book.id}>
                        <span className="book-kind">{rec.kind}</span>
                        <span className="attempt-book-title">《{rec.book.title}》</span>
                        <span className="muted small">{rec.book.author}</span>
                        <ShelfStatusControl
                          book={rec.book}
                          status={shelf[rec.book.id]?.status ?? null}
                          onChange={updateStatus}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="archive-actions">
            <button type="button" className="link-button" onClick={clearAll}>
              清除所有记录
            </button>
          </div>
        </>
      )}

      <p className="hint">
        这些记录只存在你的浏览器里，没有账号，也没有服务器备份。换设备或清除站点数据就没了。
      </p>
    </div>
  );
}
