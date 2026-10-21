'use client';

import type { Book } from '@/lib/types';
import type { ShelfStatus } from '@/lib/archive';

export const SHELF_STATUS_OPTIONS: { key: ShelfStatus; label: string }[] = [
  { key: 'planned', label: '准备读' },
  { key: 'reading', label: '正在读' },
  { key: 'done', label: '已经读完' },
];

export function ShelfStatusControl({
  book,
  status,
  onChange,
  compact = false,
}: {
  book: Book;
  status: ShelfStatus | null;
  onChange: (book: Book, status: ShelfStatus | null) => void;
  compact?: boolean;
}) {
  return (
    <div className={`status-pills ${compact ? 'compact' : ''}`}>
      {SHELF_STATUS_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`status-pill ${status === option.key ? `active ${option.key}` : ''}`}
          onClick={() => onChange(book, status === option.key ? null : option.key)}
          aria-pressed={status === option.key}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
