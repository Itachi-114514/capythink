import type { LikertItem, PracticalQuestion } from '@/lib/types';

/** 四点强制选择，没有中间项。跳过是单独动作，不是第五个选项。 */
export const SCALE_LABELS = ['不同意', '有点不同意', '有点同意', '同意'] as const;
/** 与 SCALE_LABELS 一一对应，直接就是计分值 */
export const SCALE_VALUES = [-1, -0.33, 0.33, 1] as const;

/**
 * 真题：六维 × 5 条，四点强制选择 + 可跳过。
 * pole 表示「同意这句话」时分数指向哪一极：pos = 偏右，neg = 偏左。
 * 原题里的 (R) 已记在 reverse 上，仅作对照；计分只认 pole。
 */
export const LIKERT_ITEMS: LikertItem[] = [
  // 维度一：知识来源（偏左：先验/直觉/权威 ↔ 偏右：经验/科学/理性）
  {
    id: 'k1',
    kind: 'likert',
    dim: 'knowledge',
    pole: 'pos',
    text: '只有能被科学实验和观察证实的，才算真正的知识。',
  },
  {
    id: 'k2',
    kind: 'likert',
    dim: 'knowledge',
    pole: 'neg',
    reverse: true,
    text: '很多时候，人的直觉和内心感受比逻辑推理更接近真理。',
  },
  {
    id: 'k3',
    kind: 'likert',
    dim: 'knowledge',
    pole: 'neg',
    reverse: true,
    text: '我相信有些真理（如道德法则或神圣启示）是超越人类经验存在的。',
  },
  {
    id: 'k4',
    kind: 'likert',
    dim: 'knowledge',
    pole: 'pos',
    text: '人出生时就像一张白纸，所有观念都是后天环境写上去的。',
  },
  {
    id: 'k5',
    kind: 'likert',
    dim: 'knowledge',
    pole: 'neg',
    reverse: true,
    text: '遇到不懂的问题，查阅权威经典比亲自去试错更靠谱。',
  },

  // 维度二：道德判断（偏左：义务论/绝对规则 ↔ 偏右：后果论/情境主义）
  {
    id: 'e1',
    kind: 'likert',
    dim: 'ethics',
    pole: 'pos',
    text: '评价一件事的对错，最终只能看它造成了多大伤害或带来多少好处。',
  },
  {
    id: 'e2',
    kind: 'likert',
    dim: 'ethics',
    pole: 'neg',
    reverse: true,
    text: '只要遵守了绝对的道德底线（如不撒谎、不杀人），哪怕结果很糟，我也问心无愧。',
  },
  {
    id: 'e3',
    kind: 'likert',
    dim: 'ethics',
    pole: 'pos',
    text: '世界上不存在绝对的对错，只有具体情境下的“最优解”。',
  },
  {
    id: 'e4',
    kind: 'likert',
    dim: 'ethics',
    pole: 'neg',
    reverse: true,
    text: '不管情况多特殊，有些底线是绝对不能碰的（比如牺牲一个无辜者去救一百个人也是错的）。',
  },
  {
    id: 'e5',
    kind: 'likert',
    dim: 'ethics',
    pole: 'pos',
    text: '在面对道德困境时，我会选择让整体伤亡或痛苦最少的那一边。',
  },

  // 维度三：世界构成（偏左：唯心/精神/超验 ↔ 偏右：唯物/自然/物理）
  {
    id: 'm1',
    kind: 'likert',
    dim: 'metaphysics',
    pole: 'pos',
    text: '物质世界是唯一真实的，意识不过是大脑的物理化学反应。',
  },
  {
    id: 'm2',
    kind: 'likert',
    dim: 'metaphysics',
    pole: 'neg',
    reverse: true,
    text: '宇宙中存在人类科学永远无法解释的超自然力量或精神实体。',
  },
  {
    id: 'm3',
    kind: 'likert',
    dim: 'metaphysics',
    pole: 'pos',
    text: '所有的自然灾难，仅仅是地质和气象运动的结果，没有任何“天意”或暗示。',
  },
  {
    id: 'm4',
    kind: 'likert',
    dim: 'metaphysics',
    pole: 'neg',
    reverse: true,
    text: '人的灵魂或意识，理论上是可以脱离肉体独立存在的。',
  },
  {
    id: 'm5',
    kind: 'likert',
    dim: 'metaphysics',
    pole: 'pos',
    text: '人类的所有行为，最终都可以归结为趋利避害的生物学本能。',
  },

  // 维度四：决定与自由（偏左：决定论/宿命/结构 ↔ 偏右：自由意志/存在主义）
  {
    id: 'a1',
    kind: 'likert',
    dim: 'agency',
    pole: 'neg',
    text: '人的性格和命运，很大程度上在出生时就已经被基因和环境决定了。',
  },
  {
    id: 'a2',
    kind: 'likert',
    dim: 'agency',
    pole: 'pos',
    reverse: true,
    text: '只要给我足够的自由和选择权，我可以完全重塑我自己。',
  },
  {
    id: 'a3',
    kind: 'likert',
    dim: 'agency',
    pole: 'neg',
    text: '宇宙和人类社会的发展，都受某种不可违背的客观规律支配。',
  },
  {
    id: 'a4',
    kind: 'likert',
    dim: 'agency',
    pole: 'pos',
    reverse: true,
    text: '我的每一次选择，都是出于我完全自由的意志，不受任何外力强迫。',
  },
  {
    id: 'a5',
    kind: 'likert',
    dim: 'agency',
    pole: 'neg',
    text: '为了社会的稳定运行，个人的自由随时可以被牺牲或让步。',
  },

  // 维度五：意义来源（偏左：主观建构/存在主义 ↔ 偏右：客观存在/本质主义）
  {
    id: 'n1',
    kind: 'likert',
    dim: 'meaning',
    pole: 'neg',
    text: '生命本身没有预设的意义，人必须自己去创造和赋予它意义。',
  },
  {
    id: 'n2',
    kind: 'likert',
    dim: 'meaning',
    pole: 'pos',
    reverse: true,
    text: '万事万物都有其内在的“目的”或“天命”，人只需要去发现并顺应它。',
  },
  {
    id: 'n3',
    kind: 'likert',
    dim: 'meaning',
    pole: 'neg',
    text: '所谓“人生的意义”，不过是我们用来对抗虚无感的一种心理安慰。',
  },
  {
    id: 'n4',
    kind: 'likert',
    dim: 'meaning',
    pole: 'pos',
    reverse: true,
    text: '找到一本终极的经典或一种信仰，比自己去瞎摸索人生的方向更重要。',
  },
  {
    id: 'n5',
    kind: 'likert',
    dim: 'meaning',
    pole: 'neg',
    text: '存在先于本质，我们是通过我们采取的行动来定义自己的。',
  },

  // 维度六：确定与怀疑（偏左：绝对真理/独断 ↔ 偏右：怀疑论/不可知论）
  {
    id: 'c1',
    kind: 'likert',
    dim: 'certainty',
    pole: 'pos',
    text: '科学理论永远只是暂时的假说，总有一天会被新的证据推翻。',
  },
  {
    id: 'c2',
    kind: 'likert',
    dim: 'certainty',
    pole: 'neg',
    reverse: true,
    text: '世界上一定存在绝对正确的真理，只是人类可能还没完全找到。',
  },
  {
    id: 'c3',
    kind: 'likert',
    dim: 'certainty',
    pole: 'pos',
    text: '对于超出感官经验的事物（如上帝、外星人），我们只能保持沉默和怀疑。',
  },
  {
    id: 'c4',
    kind: 'likert',
    dim: 'certainty',
    pole: 'neg',
    reverse: true,
    text: '怀疑一切会导致虚无，所以我宁愿相信一些确定、不容置疑的原则。',
  },
  {
    id: 'c5',
    kind: 'likert',
    dim: 'certainty',
    pole: 'pos',
    text: '没有任何观点是神圣不可侵犯的，包括我自己的三观。',
  },
];

export const PRACTICAL_QUESTIONS: PracticalQuestion[] = [
  {
    id: 'p1',
    kind: 'practical',
    field: 'readingLevel',
    prompt: '你的哲学阅读经验大概在哪个位置？',
    hint: '这决定我们给你推荐多难的书，不影响你的哲学状态。',
    options: [
      { text: '几乎没读过，想从零开始', value: 1 },
      { text: '读过几本入门书，比如《苏菲的世界》', value: 2 },
      { text: '读过一些原著，但不算系统', value: 3 },
      { text: '比较系统地读过西方或中国哲学史', value: 4 },
      { text: '受过专业训练，或长期在读哲学原著', value: 5 },
    ],
  },
  {
    id: 'p2',
    kind: 'practical',
    field: 'weeklyHours',
    prompt: '一期一周，你大概能拿出多少时间读书？',
    hint: '如实选就好，我们会按这个节奏给你配搭子。',
    options: [
      { text: '不到 1 小时', value: 1 },
      { text: '1–3 小时', value: 2 },
      { text: '3–6 小时', value: 3 },
      { text: '6 小时以上', value: 4 },
    ],
  },
];
