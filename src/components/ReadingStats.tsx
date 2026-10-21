import type { Shelf } from '@/lib/archive';

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${year.slice(2)}/${month}`;
}

export function ReadingStats({ shelf }: { shelf: Shelf }) {
  const done = Object.values(shelf).filter((entry) => entry.status === 'done');
  if (!done.length) return null;

  const dated = done.filter(
    (entry) => entry.finishedAt && /^\d{4}-\d{2}/.test(entry.finishedAt),
  );
  if (!dated.length) {
    return (
      <section className="section">
        <div className="section-title">
          <span className="num">统计</span>
          <h2>读完的月份</h2>
        </div>
        <div className="stats-card">
          <p className="hint mb-0">给「已经读完」的书填上日期，这里就会出现按月统计。</p>
        </div>
      </section>
    );
  }

  const counts = new Map<string, number>();
  for (const entry of dated) {
    const key = entry.finishedAt!.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const keys = [...counts.keys()].sort();
  const [firstYear, firstMonth] = keys[0].split('-').map(Number);
  const [lastYear, lastMonth] = keys[keys.length - 1].split('-').map(Number);

  const months: string[] = [];
  let year = firstYear;
  let month = firstMonth;
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  const shown = months.slice(-12);
  const max = Math.max(1, ...shown.map((key) => counts.get(key) ?? 0));
  const currentYear = new Date().getFullYear();
  const thisYear = dated.filter((entry) =>
    entry.finishedAt!.startsWith(`${currentYear}-`),
  ).length;
  const missing = done.length - dated.length;

  return (
    <section className="section">
      <div className="section-title">
        <span className="num">统计</span>
        <h2>读完的月份</h2>
      </div>
      <div className="stats-card">
        <div className="stats-head">
          <span>
            今年读完 <strong>{thisYear}</strong> 本
          </span>
          <span className="muted">书架共 {done.length} 本读完</span>
        </div>

        <div className="stats-scroll">
          <div className="stats-chart">
            {shown.map((key) => {
              const count = counts.get(key) ?? 0;
              return (
                <div className="stat-col" key={key} title={`${key}：${count} 本`}>
                  <span className="stat-count">{count || ''}</span>
                  <div className="stat-bar-wrap">
                    <span
                      className="stat-bar"
                      style={{ height: `${Math.max(2, (count / max) * 100)}%` }}
                    />
                  </div>
                  <span className="stat-label">{monthLabel(key)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {missing > 0 ? (
          <p className="hint">还有 {missing} 本读完没填日期，没算进月份。</p>
        ) : null}
      </div>
    </section>
  );
}
