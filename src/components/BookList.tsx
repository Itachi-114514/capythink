import type { Recommendation } from '@/lib/types';

export type BookEntry = Recommendation;

export function BookList({ items }: { items: Recommendation[] }) {
  if (!items.length) {
    return <div className="empty">还没有推荐，先去做一次测验。</div>;
  }
  return (
    <div className="book-list">
      {items.map((item) => (
        <article className="book-item" key={item.book.id}>
          <div className="book-spine">卡皮思</div>
          <div>
            <div className="book-title">
              《{item.book.title}》<span className="muted small">　{item.book.author}</span>
            </div>
            <div className="book-meta">
              <span className="book-kind">{item.kind}</span>
              <span>难度 {'●'.repeat(item.book.difficulty)}{'○'.repeat(5 - item.book.difficulty)}</span>
              <span>{item.book.region} · {item.book.era}</span>
            </div>
            <p className="book-reason">{item.reason}</p>
            <p className="book-reason muted">{item.book.blurb}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
