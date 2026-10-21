import { DIMS, DIM_META, type Dim, type Scores } from '@/lib/types';

const SENTENCES: Record<Dim, Record<'strongNeg' | 'mildNeg' | 'neutral' | 'mildPos' | 'strongPos', string>> = {
  knowledge: {
    strongNeg: '你相信有些东西可以先于经验被把握——直觉、权威、启示，甚至数学式的推演，都能带来确定。',
    mildNeg: '遇到问题，你更愿意先相信内心的判断，或者去翻一本可靠的书。',
    neutral: '在经验与先验之间，你没有明显的偏科。',
    mildPos: '你更愿意先看证据，再谈道理。',
    strongPos: '你相信知识来自观察、实验和可重复的经验，对漂亮的推演和权威说法都保持警惕。',
  },
  ethics: {
    strongNeg: '在道德上你看重原则：有些事不能做，哪怕结果会更好。',
    mildNeg: '你倾向用一条相对稳定的底线来判断对错。',
    neutral: '你在原则与后果之间来回使用，不觉得必须二选一。',
    mildPos: '你会把后果和具体处境放在动机之前。',
    strongPos: '你判断对错时先看后果和处境，不太相信一条能套住所有情况的规则。',
  },
  metaphysics: {
    strongNeg: '你认为精神、意识或某种超验的东西比物质更根本。',
    mildNeg: '你对「一切都能用物理和因果解释」这种说法保留余地。',
    neutral: '你对世界的构成没有强烈的立场。',
    mildPos: '你更愿意先接受一个自然的解释，除非它明显不够用。',
    strongPos: '你倾向于用物质、生理和因果解释一切，对超自然的东西保持距离。',
  },
  agency: {
    strongNeg: '你认为人的性格和选择很大程度上被基因、环境和结构决定，「自由」更多是一种感觉。',
    mildNeg: '你倾向于先找一个人行为背后的原因，而不是先夸他「选择了自己」。',
    neutral: '关于自由意志，你没有站定一边。',
    mildPos: '你相信人可以在相当大的程度上重塑自己。',
    strongPos: '你坚持人的选择出于自己的意志，任何决定论的解释都让你觉得少了点什么。',
  },
  meaning: {
    strongNeg: '你认为意义是自己造出来的，世界本身不提供答案。',
    mildNeg: '你更愿意自己给生活定一个说法，而不是接受现成的。',
    neutral: '关于意义从哪来，你还没有定论。',
    mildPos: '你相信意义有某种客观依据——目的、天命、经典，或者大于个人的东西。',
    strongPos: '你认为万事万物自有其目的，人要做的是发现并顺应它。',
  },
  certainty: {
    strongNeg: '你相信存在绝对正确的真理，哪怕人类未必能完全找到。',
    mildNeg: '你倾向于认为争论最终有一个对错，只是难说清。',
    neutral: '你在确信与怀疑之间保持平衡。',
    mildPos: '你对「唯一正确答案」这种说法比较谨慎。',
    strongPos: '你习惯悬置判断，觉得多数争论只是角度不同，没有谁神圣不可侵犯。',
  },
};

function pickSentence(dim: Dim, score: number): string {
  const table = SENTENCES[dim];
  if (score <= -0.6) return table.strongNeg;
  if (score <= -0.2) return table.mildNeg;
  if (score < 0.2) return table.neutral;
  if (score < 0.6) return table.mildPos;
  return table.strongPos;
}

export type DimStats = Partial<Record<Dim, { sem: number; n: number }>>;

/**
 * 排序规则：先按分数绝对值，同分时取标准误更小的那一维
 * （回答更一致、估计更精确），仍然相同才按 DIMS 顺序。
 * 不再用哈希硬分配，避免两个分数完全一样的人拿到不同人格。
 */
export function dimRanking(
  scores: Scores,
  undetermined: Dim[] = [],
  stats?: DimStats,
): { dim: Dim; score: number; abs: number }[] {
  const skipped = new Set(undetermined);
  return DIMS.filter((dim) => !skipped.has(dim))
    .map((dim) => ({ dim, score: scores[dim], abs: Math.abs(scores[dim]) }))
    .sort(
      (a, b) =>
        b.abs - a.abs ||
        (stats?.[a.dim]?.sem ?? 0.3) - (stats?.[b.dim]?.sem ?? 0.3),
    );
}

export function buildTypeLabel(
  scores: Scores,
  undetermined: Dim[] = [],
  stats?: DimStats,
): string {
  const ranked = dimRanking(scores, undetermined, stats);
  const main = ranked[0];
  if (!main) return '还在潜水的提问者';
  if (main.abs < 0.3) return '还没定型的提问者';

  // 12 种固定人格：只看最强的那一维，不再拼修饰语
  return DIM_META[main.dim].nouns[main.score >= 0 ? 1 : 0];
}

/**
 * 把握程度不是拍脑袋的「高/中/低」，而是拿前两维的差距，
 * 和它们各自标准误合成的误差范围比：
 * 差距 < 1 个误差 → 低；< 2 个 → 中；否则高。
 */
export function buildTypeConfidence(
  scores: Scores,
  undetermined: Dim[] = [],
  stats?: DimStats,
): 'high' | 'medium' | 'low' {
  const ranked = dimRanking(scores, undetermined, stats);
  const main = ranked[0];
  if (!main || main.abs < 0.3) return 'low';

  const second = ranked[1];
  if (!second) return 'high';

  const gap = main.abs - second.abs;
  const semMain = stats?.[main.dim]?.sem ?? 0.25;
  const semSecond = stats?.[second.dim]?.sem ?? 0.25;
  const combined = Math.sqrt(semMain * semMain + semSecond * semSecond);

  if (gap < combined) return 'low';
  if (gap < combined * 2) return 'medium';
  return 'high';
}

/** 第二维离得很近时，把它的名字也带出来，而不是藏起来 */
export function buildRunnerUp(
  scores: Scores,
  undetermined: Dim[] = [],
  stats?: DimStats,
): { dim: Dim; label: string; gap: number } | null {
  const ranked = dimRanking(scores, undetermined, stats);
  const [main, second] = ranked;
  if (!main || !second) return null;
  if (main.abs < 0.3 || second.abs < 0.3) return null;

  const gap = Math.round((main.abs - second.abs) * 1000) / 1000;
  if (gap >= 0.25) return null;

  return {
    dim: second.dim,
    label: DIM_META[second.dim].nouns[second.score >= 0 ? 1 : 0],
    gap,
  };
}

export function buildPortrait(
  scores: Scores,
  undetermined: Dim[] = [],
  stats?: DimStats,
): string {
  const ranked = dimRanking(scores, undetermined, stats);
  if (!ranked.length) {
    return '这次你把所有题都跳过了。不急着下判断也是一种态度，等你想聊的时候再来。';
  }

  const sentences = ranked.slice(0, 3).map((item) => pickSentence(item.dim, item.score));
  if (undetermined.length) {
    const names = undetermined.map((dim) => DIM_META[dim].name).join('、');
    sentences.push(`在${names}上你选择了潜水，这一块暂时留白。`);
  }
  return sentences.join('');
}

export function findTension(
  scores: Scores,
  undetermined: Dim[] = [],
  stats?: DimStats,
): string | null {
  const ranked = dimRanking(scores, undetermined, stats);
  let best: { a: Dim; b: Dim; score: number } | null = null;

  for (let i = 0; i < ranked.length; i += 1) {
    for (let j = i + 1; j < ranked.length; j += 1) {
      const a = ranked[i];
      const b = ranked[j];
      if (a.abs < 0.35 || b.abs < 0.35) continue;
      if (Math.sign(a.score) === Math.sign(b.score)) continue;
      const strength = a.abs + b.abs;
      if (!best || strength > best.score) best = { a: a.dim, b: b.dim, score: strength };
    }
  }

  if (!best) return null;

  const metaA = DIM_META[best.a];
  const metaB = DIM_META[best.b];
  const poleA = scores[best.a] >= 0 ? metaA.pos : metaA.neg;
  const poleB = scores[best.b] >= 0 ? metaB.pos : metaB.neg;

  const skipped = new Set(undetermined);
  if (!skipped.has('knowledge') && !skipped.has('ethics') && scores.knowledge > 0.3 && scores.ethics < -0.3) {
    return '你在事实问题上相信证据，在价值问题上却相信普遍原则——休谟会提醒你，这两者之间有一道很难跨过去的沟。';
  }
  if (
    !skipped.has('knowledge') &&
    !skipped.has('certainty') &&
    scores.knowledge < -0.3 &&
    scores.certainty > 0.3
  ) {
    return '你愿意凭直觉或权威直接把握某些东西，却又怀疑最终有没有确定答案。这两件事放在一起，会让你读得很不安。';
  }

  return `你在${metaA.name}上偏${poleA}，在${metaB.name}上偏${poleB}。这两个判断并不冲突，但它们会在某些时刻互相拉扯——那通常正是你该读下一本书的地方。`;
}
