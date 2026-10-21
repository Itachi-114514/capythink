import type { Book } from '@/lib/types';
import { BOOKS as BASE } from './books';
import { EXTRA_CLASSICAL } from './books-classical';
import { EXTRA_MODERN } from './books-modern';
import { EXTRA_WORLD } from './books-world';

/**
 * 书库总表：基础 90 本 + 三批扩展。
 * 按「书名 + 作者」去重，防止不同批次收进同一本书的不同译本。
 */
function merge(groups: Book[][]): Book[] {
  const byId = new Set<string>();
  const byWork = new Set<string>();
  const merged: Book[] = [];

  for (const group of groups) {
    for (const book of group) {
      const work = `${book.title}|${book.author}`;
      if (byId.has(book.id) || byWork.has(work)) continue;
      byId.add(book.id);
      byWork.add(work);
      merged.push(book);
    }
  }

  return merged.sort(
    (a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title, 'zh'),
  );
}

export const ALL_BOOKS: Book[] = merge([BASE, EXTRA_CLASSICAL, EXTRA_MODERN, EXTRA_WORLD]);
