export type Dim =
  | 'knowledge'
  | 'ethics'
  | 'metaphysics'
  | 'agency'
  | 'meaning'
  | 'certainty';

export type Pole = 'neg' | 'pos';

export const DIMS: Dim[] = [
  'knowledge',
  'ethics',
  'metaphysics',
  'agency',
  'meaning',
  'certainty',
];

/**
 * 六个维度，pos 一律对应题目说明里的「偏右」，neg 对应「偏左」。
 * 分数范围 [-1, 1]，0 为中间。
 */
export const DIM_META: Record<
  Dim,
  {
    name: string;
    neg: string;
    pos: string;
    /** 由强维度取的名词，如「经验主义者」 */
    nouns: [string, string];
    /** 由次强维度取的修饰语，如「怀疑的」 */
    modifiers: [string, string];
    /** 仅一维突出时的描述 */
    terse: [string, string];
    /** 答题时这一部分的引导语 */
    intro: string;
  }
> = {
  knowledge: {
    name: '知识来源',
    neg: '先验与直觉',
    pos: '经验与科学',
    nouns: ['先验主义者', '经验主义者'],
    modifiers: ['先验的', '经验的'],
    terse: ['相信直觉、权威与先验', '相信观察、实验与推理'],
    intro: '你相信什么才算「知道」？',
  },
  ethics: {
    name: '道德判断',
    neg: '义务论',
    pos: '后果论',
    nouns: ['义务论者', '后果论者'],
    modifiers: ['义务论的', '后果论的'],
    terse: ['把绝对规则放在结果之前', '先看后果与具体情境'],
    intro: '一件事的对错，由什么决定？',
  },
  metaphysics: {
    name: '世界构成',
    neg: '唯心与超验',
    pos: '唯物与自然',
    nouns: ['观念论者', '唯物论者'],
    modifiers: ['观念论的', '唯物论的'],
    terse: ['认为精神与超验更根本', '认为物质与自然更根本'],
    intro: '世界最终是由什么构成的？',
  },
  agency: {
    name: '决定与自由',
    neg: '决定论',
    pos: '自由意志',
    nouns: ['决定论者', '自由意志论者'],
    modifiers: ['决定论的', '自由意志的'],
    terse: ['认为人被基因、环境与结构决定', '认为人可以自己塑造自己'],
    intro: '你的选择，真的是你自己做的吗？',
  },
  meaning: {
    name: '意义来源',
    neg: '主观建构',
    pos: '客观本质',
    nouns: ['自赋意义者', '本质主义者'],
    modifiers: ['自赋的', '本质主义的'],
    terse: ['认为意义要自己造', '认为意义有客观依据'],
    intro: '人生的意义从哪里来？',
  },
  certainty: {
    name: '确定与怀疑',
    neg: '绝对真理',
    pos: '怀疑论',
    nouns: ['独断论者', '怀疑论者'],
    modifiers: ['独断的', '怀疑的'],
    terse: ['相信存在绝对真理', '倾向于悬置判断'],
    intro: '你敢确定多少？',
  },
};

export interface Scores {
  knowledge: number;
  ethics: number;
  metaphysics: number;
  agency: number;
  meaning: number;
  certainty: number;
}

export interface LikertItem {
  id: string;
  kind: 'likert';
  dim: Dim;
  /** 同意这句话时，分数指向哪一极。pos = 偏右。 */
  pole: Pole;
  text: string;
  /** 原始题库里的 (R) 标记，仅作记录；计分靠 pole，不靠它。 */
  reverse?: boolean;
}

export interface PracticalOption {
  text: string;
  value: number;
}

export interface PracticalQuestion {
  id: string;
  kind: 'practical';
  field: 'readingLevel' | 'weeklyHours';
  prompt: string;
  hint?: string;
  options: PracticalOption[];
}

export interface BookDimTag {
  dim: Dim;
  pole: Pole;
  weight: number;
}

export interface Recommendation {
  book: Book;
  kind: string;
  reason: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  dims: BookDimTag[];
  tags: string[];
  blurb: string;
  region: '西方' | '中国' | '印度' | '日本' | '其他';
  era: '古代' | '近代' | '现代' | '当代';
}

export interface QuizResult {
  scores: Scores;
  /** 5 条全部跳过的维度：分数记 0，但不参与画像与推荐 */
  undetermined: Dim[];
  readingLevel: number;
  weeklyHours: number;
  typeLabel: string;
  portrait: string;
  tension: string | null;
  /** 每个维度 5 道题的标准误，用来标不确定性 */
  dimStats?: Partial<Record<Dim, { sem: number; n: number }>>;
  /** 类型标签的把握程度：前两维差距相对误差的大小 */
  typeConfidence?: 'high' | 'medium' | 'low';
  /** 如果第二维很接近，记下它是谁 */
  runnerUp?: { dim: Dim; label: string; gap: number } | null;
}

