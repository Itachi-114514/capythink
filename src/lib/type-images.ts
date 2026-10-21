/** 结果页和档案里的人格插图。文件名对应 public/types/ 下的 WebP。 */
export const TYPE_IMAGES: Record<string, string> = {
  先验主义者: '/types/architect.webp',
  经验主义者: '/types/detective.webp',
  义务论者: '/types/judge.webp',
  后果论者: '/types/doctor.webp',
  观念论者: '/types/projectionist.webp',
  唯物论者: '/types/geologist.webp',
  决定论者: '/types/train-driver.webp',
  自由意志论者: '/types/pilot.webp',
  自赋意义者: '/types/writer.webp',
  本质主义者: '/types/botanist.webp',
  独断论者: '/types/lighthouse.webp',
  怀疑论者: '/types/meteorologist.webp',
  还没定型的提问者: '/types/undecided.webp',
  还在潜水的提问者: '/types/diving.webp',
};

export function typeImage(label: string): string | null {
  return TYPE_IMAGES[label] ?? null;
}
