import { SHELF_STATUS_OPTIONS } from '@/components/ShelfStatusControl';
import type { Shelf, ShelfEntry } from '@/lib/archive';

function timestamp(entry: ShelfEntry): string {
  return entry.noteUpdatedAt ?? entry.finishedAt ?? entry.updatedAt;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${year} 年 ${Number(month)} 月`;
}

function statusLabel(status: ShelfEntry['status']): string {
  return SHELF_STATUS_OPTIONS.find((option) => option.key === status)?.label ?? '';
}

export function NoteTimeline({ shelf }: { shelf: Shelf }) {
  const notes = Object.values(shelf)
    .filter((entry): entry is ShelfEntry & { note: string } => Boolean(entry.note?.trim()))
    .sort((a, b) => timestamp(b).localeCompare(timestamp(a)));

  if (!notes.length) return null;

  const groups = new Map<string, typeof notes>();
  for (const entry of notes) {
    const key = timestamp(entry).slice(0, 7);
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  return (
    <section className="section">
      <div className="section-title">
        <span className="num">笔记</span>
        <h2>读到哪里，想到什么</h2>
      </div>
      <div className="note-timeline">
        {[...groups.entries()].map(([key, entries]) => (
          <div className="note-group" key={key}>
            <div className="note-month">{monthLabel(key)}</div>
            {entries.map((entry) => (
              <article className="note-entry" key={entry.book.id}>
                <span className="note-dot" />
                <div className="note-body">
                  <div className="note-meta">
                    {dayLabel(timestamp(entry))} · {statusLabel(entry.status)}
                    {entry.finishedAt ? ` · 读完 ${entry.finishedAt}` : ''}
                  </div>
                  <div className="note-book">
                    《{entry.book.title}》
                    <span className="muted small">　{entry.book.author}</span>
                  </div>
                  <p className="note-text">{entry.note}</p>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
