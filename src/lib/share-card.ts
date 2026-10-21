import { DIM_COLORS } from '@/lib/dim-colors';
import type { Dim, QuizResult, Recommendation } from '@/lib/types';

const W = 1080;
const H = 920;
const PAD = 64;
const TEXT_X = 520;
const TEXT_W = 496;

const PAPER = '#f7f3ea';
const INK = '#1b1b1d';
const BODY = '#43423e';
const MUTED = '#8a857b';
const HAIRLINE = 'rgba(27, 27, 29, 0.14)';

const SANS =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';
const SERIF =
  '"Songti SC", "STSong", "SimSun", "Noto Serif SC", "Source Han Serif SC", serif';

interface TypeMeta {
  num: string;
  dim: Dim;
  role: string;
  en: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  先验主义者: { num: '01', dim: 'knowledge', role: '建筑师', en: 'EPISTEMOLOGY' },
  经验主义者: { num: '02', dim: 'knowledge', role: '侦探', en: 'EPISTEMOLOGY' },
  义务论者: { num: '03', dim: 'ethics', role: '法官', en: 'ETHICS' },
  后果论者: { num: '04', dim: 'ethics', role: '急诊医生', en: 'ETHICS' },
  观念论者: { num: '05', dim: 'metaphysics', role: '放映员', en: 'METAPHYSICS' },
  唯物论者: { num: '06', dim: 'metaphysics', role: '地质学家', en: 'METAPHYSICS' },
  决定论者: { num: '07', dim: 'agency', role: '火车司机', en: 'AGENCY' },
  自由意志论者: { num: '08', dim: 'agency', role: '飞行员', en: 'AGENCY' },
  自赋意义者: { num: '09', dim: 'meaning', role: '作家', en: 'MEANING' },
  本质主义者: { num: '10', dim: 'meaning', role: '植物学家', en: 'MEANING' },
  独断论者: { num: '11', dim: 'certainty', role: '灯塔看守人', en: 'CERTAINTY' },
  怀疑论者: { num: '12', dim: 'certainty', role: '气象观测员', en: 'CERTAINTY' },
  还没定型的提问者: { num: '13', dim: 'knowledge', role: '裁缝铺', en: 'UNDECIDED' },
  还在潜水的提问者: { num: '14', dim: 'metaphysics', role: '水下', en: 'SUBMERGED' },
};

export interface ShareCardInput {
  result: QuizResult;
  recommendations: Recommendation[];
  portraitSrc: string | null;
  host: string;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function spacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  gap: number,
): void {
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + gap;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    if (char === '\n') {
      lines.push(current);
      current = '';
      continue;
    }
    const test = current + char;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function tidyLines(lines: string[]): string[] {
  const result = [...lines];
  while (result.length > 1) {
    const last = result[result.length - 1].trim();
    if (last && /^[。，、；：！？…]+$/.test(last)) {
      result.pop();
      result[result.length - 1] += last;
    } else {
      break;
    }
  }
  return result;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image load failed'));
    image.src = src;
  });
}

export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const { result } = input;
  const meta = TYPE_META[result.typeLabel] ?? {
    num: '—',
    dim: 'knowledge' as Dim,
    role: '',
    en: 'PHILOSOPHY',
  };
  const accent = DIM_COLORS[meta.dim];

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas not available');

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(27, 27, 29, 0.12)';
  ctx.lineWidth = 1;
  roundRect(ctx, 28, 28, W - 56, H - 56, 4);
  ctx.stroke();

  // header
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = `700 24px ${SANS}`;
  ctx.fillText('卡皮思', PAD, 80);

  ctx.fillStyle = MUTED;
  ctx.font = `500 10px ${SANS}`;
  spacedText(ctx, 'CAPYTHINK / 哲学档案', PAD, 102, 1.6);

  ctx.textAlign = 'right';
  ctx.fillStyle = accent;
  ctx.font = `600 12px ${SANS}`;
  ctx.fillText(`NO. ${meta.num}`, W - PAD, 80);

  ctx.fillStyle = MUTED;
  ctx.font = `500 10px ${SANS}`;
  ctx.fillText(meta.en, W - PAD, 102);
  ctx.textAlign = 'left';

  ctx.fillStyle = accent;
  ctx.fillRect(PAD, 124, 72, 2);
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  line(ctx, PAD + 72, 125, W - PAD, 125);

  // portrait
  let portrait: HTMLImageElement | null = null;
  if (input.portraitSrc) {
    try {
      portrait = await loadImage(input.portraitSrc);
    } catch {
      portrait = null;
    }
  }

  const frame = { x: PAD, y: 160, w: 400, h: 533 };
  if (portrait) {
    ctx.fillStyle = withAlpha(accent, 0.12);
    roundRect(ctx, frame.x + 14, frame.y + 14, frame.w, frame.h, 6);
    ctx.fill();

    ctx.save();
    roundRect(ctx, frame.x, frame.y, frame.w, frame.h, 6);
    ctx.clip();
    ctx.fillStyle = '#efe9dc';
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
    const scale = Math.min(
      (frame.w - 8) / portrait.width,
      (frame.h - 8) / portrait.height,
    );
    const dw = portrait.width * scale;
    const dh = portrait.height * scale;
    ctx.drawImage(
      portrait,
      frame.x + (frame.w - dw) / 2,
      frame.y + (frame.h - dh) / 2,
      dw,
      dh,
    );
    ctx.restore();

    ctx.strokeStyle = 'rgba(27, 27, 29, 0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, frame.x, frame.y, frame.w, frame.h, 6);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = `500 12px ${SANS}`;
    ctx.fillText(meta.role, frame.x, frame.y + frame.h + 26);

    ctx.fillStyle = accent;
    ctx.fillRect(frame.x, frame.y + frame.h + 38, 28, 2);
  }

  // oversized number, faint
  ctx.fillStyle = withAlpha(accent, 0.055);
  ctx.font = `700 220px ${SERIF}`;
  ctx.textAlign = 'right';
  ctx.fillText(meta.num, W - PAD, 790);
  ctx.textAlign = 'left';

  // metadata
  ctx.fillStyle = accent;
  ctx.font = `600 11px ${SANS}`;
  spacedText(ctx, `TYPE ${meta.num} / ${meta.en}`, TEXT_X, 204, 1.8);

  // title
  ctx.fillStyle = INK;
  ctx.font = `700 60px ${SERIF}`;
  const titleLines = wrapText(ctx, result.typeLabel, TEXT_W).slice(0, 2);
  for (const [index, text] of titleLines.entries()) {
    ctx.fillText(text, TEXT_X, 292 + index * 68);
  }

  const isUnformed =
    result.typeLabel === '还没定型的提问者' ||
    result.typeLabel === '还在潜水的提问者';

  let cursor = 336;

  if (result.typeConfidence && !isUnformed) {
    const label = { high: '高', medium: '中', low: '低' }[result.typeConfidence];
    ctx.beginPath();
    ctx.arc(TEXT_X + 3, cursor - 4, 3, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.fillStyle = MUTED;
    ctx.font = `500 12px ${SANS}`;
    ctx.fillText(`把握 ${label}`, TEXT_X + 14, cursor);
    cursor += 34;
  }

  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  line(ctx, TEXT_X, cursor, TEXT_X + TEXT_W, cursor);
  cursor += 36;

  // body
  ctx.fillStyle = BODY;
  ctx.font = `400 18px ${SANS}`;
  const bodyLines = tidyLines(wrapText(ctx, result.portrait, TEXT_W));
  const shown = bodyLines.slice(0, 7);
  if (bodyLines.length > 7) {
    shown[6] = `${shown[6].slice(0, -1)}…`;
  }
  for (const [index, text] of shown.entries()) {
    ctx.fillText(text, TEXT_X, cursor + index * 31);
  }

  // footer
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  line(ctx, PAD, 810, W - PAD, 810);

  ctx.fillStyle = accent;
  ctx.fillRect(PAD, 810, 72, 2);

  ctx.fillStyle = INK;
  ctx.font = `600 18px ${SANS}`;
  ctx.fillText(input.host || '卡皮思', PAD, 852);

  ctx.fillStyle = MUTED;
  ctx.font = `400 13px ${SANS}`;
  ctx.fillText('来测测你的哲学状态', PAD, 878);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('failed to create image'));
    }, 'image/png');
  });
}
