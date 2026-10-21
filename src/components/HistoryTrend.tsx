import { DIMS, DIM_META, type Dim } from '@/lib/types';
import { DIM_COLORS } from '@/lib/dim-colors';
import type { Attempt } from '@/lib/archive';

const WIDTH = 760;
const HEIGHT = 300;
const PAD = { top: 16, right: 18, bottom: 34, left: 42 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;

function y(score: number): number {
  return PAD.top + ((1 - score) / 2) * INNER_H;
}

function x(index: number, count: number): number {
  return count <= 1
    ? PAD.left + INNER_W / 2
    : PAD.left + (index / (count - 1)) * INNER_W;
}

function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

type DeltaRow =
  | { dim: Dim; skipped: true }
  | {
      dim: Dim;
      skipped: false;
      latest: number;
      previous: number;
      delta: number;
      withinError: boolean;
    };

export function HistoryTrend({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length < 2) {
    return (
      <section className="section">
        <div className="section-title">
          <span className="num">变化</span>
          <h2>和上次相比</h2>
        </div>
        <div className="trend-card">
          <p className="hint mb-0">再做一次测验，这里就会出现六维折线图，以及和这次的对比。</p>
        </div>
      </section>
    );
  }

  const latest = attempts[0];
  const previous = attempts[1];
  const latestScores = latest.result.scores;
  const previousScores = previous.result.scores;
  const latestSkipped = new Set(latest.result.undetermined ?? []);
  const previousSkipped = new Set(previous.result.undetermined ?? []);
  const chrono = [...attempts].reverse();
  const count = chrono.length;

  const rows: DeltaRow[] = DIMS.map((dim) => {
    if (latestSkipped.has(dim) || previousSkipped.has(dim)) {
      return { dim, skipped: true };
    }
    const current = latestScores?.[dim];
    const before = previousScores?.[dim];
    if (typeof current !== 'number' || typeof before !== 'number') {
      return { dim, skipped: true };
    }
    const delta = current - before;
    const semLatest = latest.result.dimStats?.[dim]?.sem;
    const semPrevious = previous.result.dimStats?.[dim]?.sem;
    const combined =
      semLatest != null && semPrevious != null
        ? Math.sqrt(semLatest * semLatest + semPrevious * semPrevious)
        : null;
    return {
      dim,
      skipped: false,
      latest: current,
      previous: before,
      delta,
      withinError: combined != null && Math.abs(delta) < combined,
    };
  });

  const comparable = rows.filter(
    (row): row is Extract<DeltaRow, { skipped: false }> => !row.skipped,
  );
  const meaningful = comparable.filter((row) => !row.withinError);
  const biggest = [...meaningful].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  const typeLine =
    latest.result.typeLabel === previous.result.typeLabel
      ? `人格没变，还是「${latest.result.typeLabel}」。`
      : `上次是「${previous.result.typeLabel}」，这次是「${latest.result.typeLabel}」。`;

  const summary =
    comparable.length === 0
      ? '这次和上次都有维度被跳过了，暂时没有可比较的分数。'
      : meaningful.length === 0
        ? '六维的变化都落在误差范围内，这次和上次差别不大。'
        : biggest
          ? `变化最大的是${DIM_META[biggest.dim].name}：${formatDelta(biggest.delta)}。`
          : '';

  return (
    <section className="section">
      <div className="section-title">
        <span className="num">变化</span>
        <h2>和上次相比</h2>
      </div>

      <div className="trend-card">
        <p className="trend-lead">
          {typeLine} {summary}
        </p>

        <div className="trend-legend">
          {DIMS.map((dim) => (
            <span className="legend-item" key={dim}>
              <span className="legend-dot" style={{ background: DIM_COLORS[dim] }} />
              {DIM_META[dim].name}
            </span>
          ))}
        </div>

        <div className="trend-scroll">
          <svg
            className="trend-chart"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="六维分数随测验次数的变化"
          >
          {[1, 0.5, 0, -0.5, -1].map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y(value)}
                y2={y(value)}
                stroke={value === 0 ? 'rgba(29,29,31,0.18)' : 'rgba(29,29,31,0.07)'}
                strokeDasharray={value === 0 ? undefined : '2 4'}
              />
              <text
                x={PAD.left - 8}
                y={y(value) + 3}
                textAnchor="end"
                fontSize="10"
                fill="#86868b"
              >
                {value > 0 ? `+${value}` : value}
              </text>
            </g>
          ))}

          {DIMS.map((dim) => {
            let path = '';
            let drawing = false;
            for (let index = 0; index < chrono.length; index += 1) {
              const attempt = chrono[index];
              const skipped = (attempt.result.undetermined ?? []).includes(dim);
              const score = attempt.result.scores?.[dim];
              if (skipped || typeof score !== 'number') {
                drawing = false;
                continue;
              }
              path += `${drawing ? 'L' : 'M'}${x(index, count).toFixed(1)},${y(score).toFixed(1)} `;
              drawing = true;
            }
            return (
              <path
                key={dim}
                d={path}
                fill="none"
                stroke={DIM_COLORS[dim]}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            );
          })}

          {DIMS.map((dim) =>
            chrono.map((attempt, index) => {
              const skipped = (attempt.result.undetermined ?? []).includes(dim);
              const score = attempt.result.scores?.[dim];
              if (skipped || typeof score !== 'number') return null;
              const isLatest = index === count - 1;
              if (!isLatest && count > 12) return null;
              return (
                <circle
                  key={`${dim}-${index}`}
                  cx={x(index, count)}
                  cy={y(score)}
                  r={isLatest ? 3 : 2}
                  fill={DIM_COLORS[dim]}
                  stroke={isLatest ? '#fbfbf9' : 'none'}
                  strokeWidth={isLatest ? 1.4 : 0}
                />
              );
            }),
          )}

          {count > 1 ? (
            <>
              <text
                x={x(0, count)}
                y={HEIGHT - 12}
                textAnchor="start"
                fontSize="10"
                fill="#86868b"
              >
                {shortDate(chrono[0].savedAt)}
              </text>
              <text
                x={x(count - 1, count)}
                y={HEIGHT - 12}
                textAnchor="end"
                fontSize="10"
                fill="#86868b"
              >
                {shortDate(chrono[count - 1].savedAt)}
              </text>
            </>
          ) : null}
          </svg>
        </div>

        <div className="trend-deltas">
          {rows.map((row) => (
            <div className="delta-item" key={row.dim}>
              <span className="delta-dim">{DIM_META[row.dim].name}</span>
              {row.skipped ? (
                <span className="delta-flag within">有一侧潜水，无法比较</span>
              ) : (
                <>
                  <span className="delta-value">
                    上次 {row.previous.toFixed(2)} → {row.latest.toFixed(2)}
                  </span>
                  <span
                    className={`delta-flag ${
                      row.withinError
                        ? 'within'
                        : row.delta > 0.02
                          ? 'up'
                          : row.delta < -0.02
                            ? 'down'
                            : 'flat'
                    }`}
                    title={row.withinError ? '变化小于两次测量的合成误差' : undefined}
                  >
                    {row.withinError
                      ? `≈ ${formatDelta(row.delta)}`
                      : `${row.delta > 0.02 ? '↑' : row.delta < -0.02 ? '↓' : '→'} ${formatDelta(row.delta)}`}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        <p className="hint">
          横轴按测验次数排列，不是等间隔时间；纵轴 -1 到 +1。线断开表示那次把这一维跳过了。两条记录之差如果小于两次测量的合成误差，会标成 ≈，不当作真实变化。
        </p>
      </div>
    </section>
  );
}
