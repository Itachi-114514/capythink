import { DIMS, DIM_META, type Dim, type Scores } from '@/lib/types';

export function ScoreBars({
  scores,
  undetermined = [],
  stats,
}: {
  scores: Scores;
  undetermined?: Dim[];
  stats?: Partial<Record<Dim, { sem: number }>>;
}) {
  const skipped = new Set(undetermined);

  return (
    <div className="bars">
      {DIMS.map((dim) => {
        const value = scores[dim];
        const unknown = skipped.has(dim);
        const magnitude = Math.abs(value);
        const width = `${(magnitude * 50).toFixed(1)}%`;
        const left = value >= 0 ? '50%' : `${(50 - magnitude * 50).toFixed(1)}%`;
        const sem = stats?.[dim]?.sem ?? 0;
        const lower = Math.max(0, Math.min(100, 50 + (value - sem) * 50));
        const upper = Math.max(0, Math.min(100, 50 + (value + sem) * 50));

        return (
          <div className={`bar-row ${unknown ? 'is-unknown' : ''}`} key={dim}>
            <span className="bar-label">{DIM_META[dim].name}</span>
            <span className={`bar-track ${unknown ? 'bar-track-unknown' : ''}`}>
              {!unknown && sem > 0 ? (
                <span
                  className="bar-uncertain"
                  style={{
                    left: `${lower}%`,
                    width: `${Math.max(0.5, upper - lower)}%`,
                  }}
                  title={`±${sem.toFixed(2)}（近似标准误）`}
                />
              ) : null}
              <span className="bar-mid" />
              {unknown ? null : (
                <span
                  className={`bar-fill ${value < 0 ? 'neg' : ''}`}
                  style={{ left, width }}
                />
              )}
            </span>
            <span className={`bar-value ${unknown ? 'bar-unknown' : ''}`}>
              {unknown ? '潜水' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
