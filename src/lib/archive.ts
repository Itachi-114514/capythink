import type { Book, QuizResult, Recommendation } from '@/lib/types';
import {
  HISTORY_STORAGE_KEY,
  RESULT_STORAGE_KEY,
  SHELF_STORAGE_KEY,
} from '@/lib/storage';

export type ShelfStatus = 'planned' | 'reading' | 'done';

export interface Attempt {
  id: string;
  savedAt: string;
  result: QuizResult;
  recommendations: Recommendation[];
}

export interface ShelfEntry {
  status: ShelfStatus;
  updatedAt: string;
  book: Book;
  /** 一句话感想，最多 120 字 */
  note?: string;
  /** 感想最后一次保存的时间，用来排笔记时间线 */
  noteUpdatedAt?: string;
  /** 读完日期，YYYY-MM-DD */
  finishedAt?: string;
}

export type Shelf = Record<string, ShelfEntry>;

export interface BackupFile {
  app: 'capythink';
  version: number;
  exportedAt?: string;
  history: Attempt[];
  shelf: Shelf;
  result: unknown | null;
}

export type ImportResult =
  | { ok: true; history: number; shelf: number }
  | { ok: false; error: string };

const MAX_ATTEMPTS = 30;
export const BACKUP_VERSION = 1;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 配额满了或隐私模式，忽略
  }
}

function isAttempt(value: unknown): value is Attempt {
  const attempt = value as Attempt;
  return Boolean(
    attempt &&
      typeof attempt.id === 'string' &&
      typeof attempt.savedAt === 'string' &&
      attempt.result &&
      typeof attempt.result.typeLabel === 'string' &&
      Array.isArray(attempt.recommendations) &&
      attempt.recommendations.every(
        (rec) => rec && rec.book && typeof rec.book.id === 'string',
      ),
  );
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

function isShelfEntry(value: unknown): value is ShelfEntry {
  const entry = value as ShelfEntry;
  return Boolean(
    entry &&
      (entry.status === 'planned' ||
        entry.status === 'reading' ||
        entry.status === 'done') &&
      entry.book &&
      typeof entry.book.id === 'string' &&
      typeof entry.book.title === 'string' &&
      (entry.note === undefined || typeof entry.note === 'string') &&
      (entry.noteUpdatedAt === undefined || typeof entry.noteUpdatedAt === 'string') &&
      (entry.finishedAt === undefined || typeof entry.finishedAt === 'string'),
  );
}

function isResultPayload(
  value: unknown,
): value is { result: QuizResult; recommendations: Recommendation[]; savedAt?: string } {
  const payload = value as { result?: QuizResult; recommendations?: Recommendation[] };
  return Boolean(
    payload &&
      payload.result &&
      typeof payload.result.typeLabel === 'string' &&
      Array.isArray(payload.recommendations),
  );
}

export function readHistory(): Attempt[] {
  const data = readJson<unknown>(HISTORY_STORAGE_KEY, []);
  if (!Array.isArray(data)) return [];
  return data.filter(isAttempt);
}

export function addAttempt(input: {
  savedAt: string;
  result: QuizResult;
  recommendations: Recommendation[];
}): void {
  const attempt: Attempt = {
    id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
  };
  writeJson(HISTORY_STORAGE_KEY, [attempt, ...readHistory()].slice(0, MAX_ATTEMPTS));
}

export function readShelf(): Shelf {
  const data = readJson<unknown>(SHELF_STORAGE_KEY, {});
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

  const shelf: Shelf = {};
  for (const [id, value] of Object.entries(data)) {
    if (isShelfEntry(value)) shelf[id] = value;
  }
  return shelf;
}

export function setBookStatus(book: Book, status: ShelfStatus | null): Shelf {
  const shelf = readShelf();
  if (status) {
    const existing = shelf[book.id];
    shelf[book.id] = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
      book,
      // 第一次标成「已经读完」时，默认今天；之后保留用户改过的日期
      ...(status === 'done' && !existing?.finishedAt ? { finishedAt: localDate() } : {}),
    };
  } else {
    delete shelf[book.id];
  }
  writeJson(SHELF_STORAGE_KEY, shelf);
  return shelf;
}

export function setBookNote(book: Book, note: string): Shelf {
  const shelf = readShelf();
  const existing = shelf[book.id];
  if (!existing) return shelf;

  const trimmed = note.trim().slice(0, 120);
  const now = new Date().toISOString();
  shelf[book.id] = {
    ...existing,
    updatedAt: now,
    ...(trimmed
      ? { note: trimmed, noteUpdatedAt: now }
      : { note: undefined, noteUpdatedAt: undefined }),
  };
  writeJson(SHELF_STORAGE_KEY, shelf);
  return shelf;
}

export function setBookFinishedAt(book: Book, date: string): Shelf {
  const shelf = readShelf();
  const existing = shelf[book.id];
  if (!existing) return shelf;

  shelf[book.id] = {
    ...existing,
    updatedAt: new Date().toISOString(),
    ...(date ? { finishedAt: date } : { finishedAt: undefined }),
  };
  writeJson(SHELF_STORAGE_KEY, shelf);
  return shelf;
}

/** 贴过标签的书（准备读 / 正在读 / 已经读完）都不再进入下一轮推荐 */
export function getExcludedBookIds(): Set<string> {
  const shelf = readShelf();
  return new Set(Object.keys(shelf));
}

export function clearArchive(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    window.localStorage.removeItem(SHELF_STORAGE_KEY);
    window.localStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // 忽略
  }
}

export function exportArchive(): string {
  const payload: BackupFile = {
    app: 'capythink',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    history: readHistory(),
    shelf: readShelf(),
    result: readJson<unknown>(RESULT_STORAGE_KEY, null),
  };
  return JSON.stringify(payload, null, 2);
}

export function importArchive(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: '这个文件不是有效的 JSON。' };
  }

  const data = parsed as Partial<BackupFile>;
  if (!data || data.app !== 'capythink') {
    return { ok: false, error: '这不是卡皮思导出的备份文件。' };
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    return { ok: false, error: '备份文件版本太新，请先更新站点。' };
  }

  const history = Array.isArray(data.history)
    ? data.history.filter(isAttempt).slice(0, MAX_ATTEMPTS)
    : [];
  const shelf: Shelf = {};
  if (data.shelf && typeof data.shelf === 'object' && !Array.isArray(data.shelf)) {
    for (const [id, value] of Object.entries(data.shelf)) {
      if (isShelfEntry(value)) shelf[id] = value;
    }
  }
  const result = isResultPayload(data.result) ? data.result : null;

  writeJson(HISTORY_STORAGE_KEY, history);
  writeJson(SHELF_STORAGE_KEY, shelf);
  if (result) {
    writeJson(RESULT_STORAGE_KEY, result);
  } else if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(RESULT_STORAGE_KEY);
    } catch {
      // 忽略
    }
  }

  return { ok: true, history: history.length, shelf: Object.keys(shelf).length };
}

/** 旧版本只有最后一次结果，没有历史；第一次打开档案时把它补成一条记录 */
export function migrateLegacyResult(): void {
  if (readHistory().length > 0) return;

  const legacy = readJson<{
    result?: QuizResult;
    recommendations?: Recommendation[];
    savedAt?: string;
  } | null>(RESULT_STORAGE_KEY, null);

  if (!legacy?.result || !Array.isArray(legacy.recommendations)) return;

  addAttempt({
    savedAt: legacy.savedAt ?? new Date().toISOString(),
    result: legacy.result,
    recommendations: legacy.recommendations,
  });
}
