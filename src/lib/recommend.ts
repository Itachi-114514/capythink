import { ALL_BOOKS as BOOKS } from '@data/books-all';
import {
  DIMS,
  DIM_META,
  type Book,
  type Dim,
  type Pole,
  type Recommendation,
  type Scores,
} from '@/lib/types';

export type RecommendationResult = Recommendation;

function tagPole(book: Book, dim: Dim): { pole: Pole; weight: number } | null {
  const tag = book.dims.find((item) => item.dim === dim);
  return tag ? { pole: tag.pole, weight: tag.weight } : null;
}

function alignment(book: Book, scores: Scores): number {
  let total = 0;
  let weightSum = 0;
  for (const tag of book.dims) {
    const userScore = scores[tag.dim];
    const poleSign = tag.pole === 'pos' ? 1 : -1;
    total += userScore * poleSign * tag.weight;
    weightSum += tag.weight;
  }
  if (weightSum === 0) return 0;
  // 标签总权重太低，说明这本书在这一维上立场并不鲜明，不该拿满分
  const confidence = Math.min(1, weightSum / 0.9);
  return (total / weightSum) * confidence;
}

function difficultyFit(book: Book, level: number): number {
  return 1 - Math.abs(book.difficulty - level) / 4;
}

function ranked(scores: Scores): { dim: Dim; score: number; abs: number }[] {
  return DIMS.map((dim) => ({ dim, score: scores[dim], abs: Math.abs(scores[dim]) })).sort(
    (a, b) => b.abs - a.abs,
  );
}

function poleLabel(dim: Dim, pole: Pole): string {
  return pole === 'pos' ? DIM_META[dim].pos : DIM_META[dim].neg;
}

/** 让同一份画像每次得到同一份书单，不同画像之间又不会全撞在同一本 */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pick = (
  predicate: (book: Book) => boolean,
  sort: (a: Book, b: Book) => number,
  options?: { topN?: number; allowSameAuthor?: boolean },
) => Book | undefined;

export function recommendBooks(
  scores: Scores,
  level: number,
  hours: number,
  undetermined: Dim[] = [],
  excludeIds: Iterable<string> = [],
): RecommendationResult[] {
  const used = new Set<string>();
  const usedAuthors = new Set<string>();
  const usedRegions = new Set<string>();
  const excluded = new Set(excludeIds);
  const results: RecommendationResult[] = [];

  const rng = mulberry32(
    hashString(`${JSON.stringify(scores)}|${level}|${hours}|${[...undetermined].sort().join(',')}`),
  );

  const add = (book: Book | undefined, kind: string, reason: string) => {
    if (!book || used.has(book.id)) return;
    used.add(book.id);
    usedAuthors.add(book.author);
    usedRegions.add(book.region);
    results.push({ book, kind, reason });
  };

  const pick: Pick = (predicate, sort, options = {}) => {
    const { topN = 1, allowSameAuthor = false } = options;
    const candidates = BOOKS.filter(
      (book) =>
        !used.has(book.id) &&
        !excluded.has(book.id) &&
        (allowSameAuthor || !usedAuthors.has(book.author)) &&
        predicate(book),
    ).sort(sort);
    if (candidates.length === 0) return undefined;
    const pool = candidates.slice(0, Math.max(1, Math.min(topN, candidates.length)));
    return pool[Math.floor(rng() * pool.length)];
  };

  // 全跳过的维度不参与推荐：不拿它当强项，也不拿它当短板
  const skipped = new Set(undetermined);
  const ordered = ranked(scores).filter((entry) => !skipped.has(entry.dim));
  const main = ordered[0];
  const weak = [...ordered].sort((a, b) => a.abs - b.abs)[0];
  const mainPole: Pole | null = main ? (main.score >= 0 ? 'pos' : 'neg') : null;

  const byAlignment = (a: Book, b: Book) =>
    alignment(b, scores) - alignment(a, scores) ||
    difficultyFit(b, level) - difficultyFit(a, level);

  if (main && mainPole) {
    // 「顺着你」优先挑在最强那一维上真有立场的书，否则理由会文不对题
    const along =
      pick(
        (book) =>
          Math.abs(book.difficulty - level) <= 1 &&
          alignment(book, scores) > 0.05 &&
          Boolean(tagPole(book, main.dim)),
        byAlignment,
        { topN: 6 },
      ) ??
      pick(
        (book) => Math.abs(book.difficulty - level) <= 1 && alignment(book, scores) > 0.05,
        byAlignment,
        { topN: 6 },
      );
    if (along) {
      const tag = tagPole(along, main.dim);
      const dimName = DIM_META[main.dim].name;
      const poleName = tag ? poleLabel(main.dim, tag.pole) : poleLabel(main.dim, mainPole);
      add(
        along,
        '顺着你',
        `你在${dimName}上偏${poleName}。${along.author}的《${along.title}》把这一路想法推得最远——读的时候留意哪里让你不舒服。`,
      );
    }
  }

  if (weak) {
    const patch = pick(
      (book) => {
        const tag = tagPole(book, weak.dim);
        return Boolean(tag && tag.weight >= 0.5 && book.difficulty <= level + 1);
      },
      (a, b) =>
        (tagPole(b, weak.dim)?.weight ?? 0) - (tagPole(a, weak.dim)?.weight ?? 0) ||
        difficultyFit(a, level) - difficultyFit(b, level),
      { topN: 4 },
    );
    if (patch) {
      const weakScore = scores[weak.dim];
      const weakMeta = DIM_META[weak.dim];
      const weakPhrase =
        Math.abs(weakScore) < 0.25
          ? `你在${weakMeta.name}上还没有明显倾向`
          : `你在${weakMeta.name}上只是略微偏${weakScore >= 0 ? weakMeta.pos : weakMeta.neg}`;
      add(
        patch,
        '补短板',
        `${weakPhrase}。${patch.author}的《${patch.title}》先把这一边讲清楚，读完再决定站哪边。`,
      );
    }
  }

  if (main && mainPole) {
    const opposite = pick(
      (book) => {
        const tag = tagPole(book, main.dim);
        return Boolean(
          tag &&
            tag.pole !== mainPole &&
            tag.weight >= 0.5 &&
            book.difficulty <= Math.max(level, 3),
        );
      },
      (a, b) => (tagPole(b, main.dim)?.weight ?? 0) - (tagPole(a, main.dim)?.weight ?? 0),
      { topN: 4 },
    );
    if (opposite) {
      add(
        opposite,
        '对立面',
        `你偏${poleLabel(main.dim, mainPole)}，${opposite.author}的《${opposite.title}》站在对面。读它不是要被说服，是要知道对面最强的理由长什么样。`,
      );
    }
  }

  const anchorBase = (book: Book) =>
    book.difficulty <= 2 && (book.tags.includes('入门') || book.tags.includes('经典'));
  const anchorSort = (a: Book, b: Book) =>
    Number(b.tags.includes('入门')) - Number(a.tags.includes('入门')) ||
    Number(b.tags.includes('经典')) - Number(a.tags.includes('经典')) ||
    a.year - b.year;

  // 锚点尽量落在用户最强的那一维上，而不是所有人都拿到同一本《会饮》
  const anchor =
    (main
      ? pick((book) => anchorBase(book) && Boolean(tagPole(book, main.dim)), anchorSort, {
          topN: 8,
        })
      : undefined) ?? pick(anchorBase, anchorSort, { topN: 10 });
  if (anchor) {
    add(
      anchor,
      '入门锚点',
      `如果只读一本入门的，${anchor.author}的《${anchor.title}》最不容易把人劝退。先读完，比读得对更重要。`,
    );
  }

  const breatherBase = (book: Book) =>
    book.difficulty <= level + 1 &&
    book.tags.some((tag) => ['随笔', '对话', '书信', '小说'].includes(tag));
  const breatherSort = (a: Book, b: Book) => difficultyFit(b, level) - difficultyFit(a, level);
  // 换气优先换一个前面没出现过的地区，书单不至于全是西方
  const breather =
    pick((book) => breatherBase(book) && !usedRegions.has(book.region), breatherSort, {
      topN: 8,
    }) ?? pick(breatherBase, breatherSort, { topN: 8 });
  if (breather) {
    add(
      breather,
      '换气',
      `读不动大部头的时候，${breather.author}的《${breather.title}》可以换口气。它不谈体系，只谈一个人怎么想事情。`,
    );
  }

  if (results.length < 5) {
    const fillerSort = (a: Book, b: Book) =>
      0.6 * alignment(b, scores) +
      0.4 * difficultyFit(b, level) -
      (0.6 * alignment(a, scores) + 0.4 * difficultyFit(a, level));
    while (results.length < 5) {
      const next =
        pick(
          (book) => Math.abs(book.difficulty - level) <= 1,
          fillerSort,
          { topN: 3 },
        ) ??
        pick(
          () => true,
          fillerSort,
          { topN: 3, allowSameAuthor: true },
        );
      if (!next) break;
      add(
        next,
        '顺手一本',
        `和你现在的状态离得不远，难度也合适。${next.author}的《${next.title}》，可以当作备选。`,
      );
    }
  }

  return results;
}

export function findBook(id: string): Book | undefined {
  return BOOKS.find((book) => book.id === id);
}
