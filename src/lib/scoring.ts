import { LIKERT_ITEMS, PRACTICAL_QUESTIONS, SCALE_VALUES } from '@data/questions';
import { DIMS, type Dim, type QuizResult, type Scores } from '@/lib/types';
import {
  buildPortrait,
  buildRunnerUp,
  buildTypeConfidence,
  buildTypeLabel,
  findTension,
  type DimStats,
} from '@/lib/labels';

/** null 表示「这题跳过」，缺键表示「还没答到」 */
export interface AnswerMap {
  [itemId: string]: number | null;
}

const VALID_VALUES = new Set<number>(SCALE_VALUES);

export function validateAnswers(answers: AnswerMap): string | null {
  for (const [index, item] of LIKERT_ITEMS.entries()) {
    if (!(item.id in answers)) {
      return `第 ${index + 1} 题还没有作答`;
    }
    const value = answers[item.id];
    if (value !== null && !VALID_VALUES.has(value)) {
      return `第 ${index + 1} 题的答案不合法`;
    }
  }
  for (const question of PRACTICAL_QUESTIONS) {
    const value = answers[question.id];
    if (typeof value !== 'number' || value < 0 || value >= question.options.length) {
      return `「${question.prompt}」还没有选`;
    }
  }
  return null;
}

export function computeQuiz(answers: AnswerMap): QuizResult {
  const sums: Record<Dim, number> = {
    knowledge: 0,
    ethics: 0,
    metaphysics: 0,
    agency: 0,
    meaning: 0,
    certainty: 0,
  };
  const counts: Record<Dim, number> = {
    knowledge: 0,
    ethics: 0,
    metaphysics: 0,
    agency: 0,
    meaning: 0,
    certainty: 0,
  };
  const values = {} as Record<Dim, number[]>;
  for (const dim of DIMS) values[dim] = [];

  for (const item of LIKERT_ITEMS) {
    const value = answers[item.id];
    // 跳过的不进分母，也不当 0 分
    if (value === null || value === undefined) continue;
    const sign = item.pole === 'pos' ? 1 : -1;
    const signed = value * sign;
    sums[item.dim] += signed;
    counts[item.dim] += 1;
    values[item.dim].push(signed);
  }

  const scores = {} as Scores;
  const undetermined: Dim[] = [];
  for (const dim of DIMS) {
    if (counts[dim] === 0) {
      scores[dim] = 0;
      undetermined.push(dim);
      continue;
    }
    const raw = sums[dim] / counts[dim];
    scores[dim] = Math.max(-1, Math.min(1, Math.round(raw * 1000) / 1000));
  }

  // 每题 5 道，分数是均值；用维度内部的离散度估一个近似的标准误。
  // 题太少（<3）时不给虚假的精确，直接给一个保守值；5 题完全一致时也给 0.06 的地板。
  const dimStats = {} as DimStats;
  for (const dim of DIMS) {
    const list = values[dim];
    const n = list.length;
    if (n === 0) {
      dimStats[dim] = { sem: 0, n: 0 };
      continue;
    }
    const mean = list.reduce((sum, entry) => sum + entry, 0) / n;
    const variance =
      n > 1 ? list.reduce((sum, entry) => sum + (entry - mean) ** 2, 0) / (n - 1) : 0;
    const sd = Math.sqrt(variance);
    const sem = n < 3 ? 0.45 : Math.max(0.06, sd / Math.sqrt(n));
    dimStats[dim] = { sem: Math.round(sem * 1000) / 1000, n };
  }

  const levelQuestion = PRACTICAL_QUESTIONS.find((q) => q.field === 'readingLevel');
  const hoursQuestion = PRACTICAL_QUESTIONS.find((q) => q.field === 'weeklyHours');
  const readingLevel =
    (levelQuestion && levelQuestion.options[answers[levelQuestion.id] as number]?.value) || 2;
  const weeklyHours =
    (hoursQuestion && hoursQuestion.options[answers[hoursQuestion.id] as number]?.value) || 2;

  return {
    scores,
    undetermined,
    readingLevel,
    weeklyHours,
    typeLabel: buildTypeLabel(scores, undetermined, dimStats),
    typeConfidence: buildTypeConfidence(scores, undetermined, dimStats),
    runnerUp: buildRunnerUp(scores, undetermined, dimStats),
    portrait: buildPortrait(scores, undetermined, dimStats),
    tension: findTension(scores, undetermined, dimStats),
    dimStats,
  };
}
