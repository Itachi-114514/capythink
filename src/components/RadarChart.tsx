import { DIMS, DIM_META, type Scores } from '@/lib/types';

const CENTER = 170;
const RADIUS = 118;

const GRID = 'rgba(29, 29, 31, 0.10)';
const ACCENT = '#2e4f4f';
const ACCENT_FILL = 'rgba(46, 79, 79, 0.18)';
const LABEL = '#86868b';

function angleFor(index: number): number {
  return ((-90 + index * 60) * Math.PI) / 180;
}

function point(index: number, ratio: number): [number, number] {
  const angle = angleFor(index);
  return [CENTER + Math.cos(angle) * RADIUS * ratio, CENTER + Math.sin(angle) * RADIUS * ratio];
}

export function RadarChart({ scores }: { scores: Scores }) {
  const rings = [0.25, 0.5, 0.75, 1];

  const polygon = DIMS.map((dim, index) => {
    const ratio = (scores[dim] + 1) / 2;
    return point(index, ratio).join(',');
  }).join(' ');

  return (
    <svg
      className="radar"
      viewBox="-40 -12 400 364"
      role="img"
      aria-label="六维哲学状态雷达图"
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={DIMS.map((_, index) => point(index, ring).join(',')).join(' ')}
          fill="none"
          stroke={GRID}
          strokeWidth={ring === 1 ? 1 : 0.7}
        />
      ))}

      {DIMS.map((dim, index) => {
        const [x, y] = point(index, 1);
        return (
          <line
            key={dim}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke={GRID}
            strokeWidth={0.7}
          />
        );
      })}

      <polygon points={polygon} fill={ACCENT_FILL} stroke={ACCENT} strokeWidth={1.5} />

      {DIMS.map((dim, index) => {
        const [x, y] = point(index, 1.15);
        const cos = Math.cos(angleFor(index));
        const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
        return (
          <text
            key={dim}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={12}
            fill={LABEL}
            fontFamily="-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif"
          >
            {DIM_META[dim].name}
          </text>
        );
      })}
    </svg>
  );
}
