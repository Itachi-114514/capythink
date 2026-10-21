'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ALL_BOOKS } from '@data/books-all';
import { DIMS, DIM_META, type Book, type Dim, type Pole } from '@/lib/types';
import { DIM_COLORS } from '@/lib/dim-colors';
import { readShelf, setBookStatus, type Shelf, type ShelfStatus } from '@/lib/archive';
import {
  SHELF_STATUS_OPTIONS,
  ShelfStatusControl,
} from '@/components/ShelfStatusControl';

type Region = Book['region'];
type SortKey = 'difficulty' | 'year' | 'title';

const REGIONS: Region[] = ['西方', '中国', '印度', '日本', '其他'];
const PAGE_SIZE = 48;

function yearLabel(year: number): string {
  return year < 0 ? `公元前 ${Math.abs(year)}` : `${year}`;
}

export function BookLibrary() {
  const [query, setQuery] = useState('');
  const [dim, setDim] = useState<Dim | ''>('');
  const [pole, setPole] = useState<Pole | ''>('');
  const [difficulty, setDifficulty] = useState(0);
  const [region, setRegion] = useState<Region | ''>('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<ShelfStatus | 'none' | 'note' | ''>('');
  const [sort, setSort] = useState<SortKey>('difficulty');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [shelf, setShelf] = useState<Shelf>({});

  useEffect(() => {
    setShelf(readShelf());
  }, []);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [query, dim, pole, difficulty, region, tag, status, sort]);

  function updateStatus(book: Book, next: ShelfStatus | null) {
    setShelf(setBookStatus(book, next));
  }

  const allTags = useMemo(
    () =>
      Array.from(new Set(ALL_BOOKS.flatMap((book) => book.tags))).sort((a, b) =>
        a.localeCompare(b, 'zh-CN'),
      ),
    [],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = ALL_BOOKS.filter((book) => {
      if (needle) {
        const haystack = `${book.title} ${book.author} ${book.blurb} ${book.tags.join(' ')} ${book.dims
          .map((entry) => DIM_META[entry.dim].name)
          .join(' ')}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (dim) {
        const match = book.dims.some(
          (entry) => entry.dim === dim && (!pole || entry.pole === pole),
        );
        if (!match) return false;
      } else if (pole && !book.dims.some((entry) => entry.pole === pole)) {
        return false;
      }

      if (difficulty && book.difficulty !== difficulty) return false;
      if (region && book.region !== region) return false;
      if (tag && !book.tags.includes(tag)) return false;

      if (status === 'none') {
        if (shelf[book.id]) return false;
      } else if (status === 'note') {
        if (!shelf[book.id]?.note) return false;
      } else if (status && shelf[book.id]?.status !== status) {
        return false;
      }

      return true;
    });

    if (sort === 'difficulty') {
      result.sort(
        (a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title, 'zh-CN'),
      );
    } else if (sort === 'year') {
      result.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, 'zh-CN'));
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
    }

    return result;
  }, [query, dim, pole, difficulty, region, tag, status, sort, shelf]);

  const visible = filtered.slice(0, limit);
  const dimMeta = dim ? DIM_META[dim] : null;

  function reset() {
    setQuery('');
    setDim('');
    setPole('');
    setDifficulty(0);
    setRegion('');
    setTag('');
    setStatus('');
    setSort('difficulty');
  }

  return (
    <div className="wrap page">
      <div className="page-head">
        <div className="kicker">书库 · {ALL_BOOKS.length} 本</div>
        <h1>慢慢挑一本</h1>
        <p className="lede">
          按六个维度、难度、地区和标签筛。看到想读的，直接贴标签；贴过标签的书不会再进下一次推荐。
        </p>
      </div>

      <div className="library-filters">
        <input
          className="filter-search"
          type="search"
          placeholder="搜书名、作者、标签…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="filter-row">
          <label className="filter-field">
            <span>维度</span>
            <select
              value={dim}
              onChange={(event) => {
                setDim(event.target.value as Dim | '');
                setPole('');
              }}
            >
              <option value="">全部</option>
              {DIMS.map((entry) => (
                <option key={entry} value={entry}>
                  {DIM_META[entry].name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>方向</span>
            <select
              value={pole}
              onChange={(event) => setPole(event.target.value as Pole | '')}
            >
              <option value="">全部</option>
              <option value="neg">{dimMeta ? dimMeta.neg : '负端'}</option>
              <option value="pos">{dimMeta ? dimMeta.pos : '正端'}</option>
            </select>
          </label>

          <label className="filter-field">
            <span>难度</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(Number(event.target.value))}
            >
              <option value={0}>全部</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {'●'.repeat(value)}
                  {'○'.repeat(5 - value)}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>地区</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value as Region | '')}
            >
              <option value="">全部</option>
              {REGIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>标签</span>
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="">全部</option>
              {allTags.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>书架</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ShelfStatus | 'none' | 'note' | '')
              }
            >
              <option value="">全部</option>
              <option value="none">未标记</option>
              <option value="note">已写感想</option>
              {SHELF_STATUS_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>排序</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="difficulty">难度</option>
              <option value="year">年份</option>
              <option value="title">书名</option>
            </select>
          </label>

          <button type="button" className="btn btn-ghost filter-reset" onClick={reset}>
            清除筛选
          </button>
        </div>
      </div>

      <div className="library-count">
        <span>
          共 {filtered.length} 本，显示 {Math.min(limit, filtered.length)} 本
        </span>
        <Link href="/me" className="small">
          去我的书架
        </Link>
      </div>

      {visible.length ? (
        <div className="lib-grid">
          {visible.map((book) => (
            <article className="lib-card" key={book.id}>
              <div className="lib-card-head">
                <div>
                  <h3 className="lib-title">《{book.title}》</h3>
                  <div className="lib-author">
                    {book.author} · {yearLabel(book.year)}
                  </div>
                </div>
                <span className="lib-difficulty" title={`难度 ${book.difficulty} / 5`}>
                  {'●'.repeat(book.difficulty)}
                  {'○'.repeat(5 - book.difficulty)}
                </span>
              </div>

              <div className="lib-meta">
                <span>
                  {book.region} · {book.era}
                </span>
                {book.dims.map((entry) => (
                  <span className="lib-dim" key={`${entry.dim}-${entry.pole}`}>
                    <span
                      className="lib-dot"
                      style={{ background: DIM_COLORS[entry.dim] }}
                    />
                    {DIM_META[entry.dim].name} ·{' '}
                    {entry.pole === 'pos' ? DIM_META[entry.dim].pos : DIM_META[entry.dim].neg}
                  </span>
                ))}
              </div>

              <p className="lib-blurb">{book.blurb}</p>

              <div className="lib-tags">
                {book.tags.map((value) => (
                  <span className="lib-tag" key={value}>
                    {value}
                  </span>
                ))}
                {shelf[book.id]?.note ? (
                  <span className="lib-note-flag">已写感想</span>
                ) : null}
              </div>

              <ShelfStatusControl
                book={book}
                status={shelf[book.id]?.status ?? null}
                onChange={updateStatus}
                compact
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">没有符合条件的书。试试放宽筛选。</div>
      )}

      {filtered.length > visible.length ? (
        <div className="load-more">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
          >
            再显示 {Math.min(PAGE_SIZE, filtered.length - visible.length)} 本
          </button>
        </div>
      ) : null}
    </div>
  );
}
