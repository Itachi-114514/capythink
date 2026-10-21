import type { Metadata } from 'next';
import { BookLibrary } from '@/components/BookLibrary';

export const metadata: Metadata = {
  title: '书库 · 卡皮思 CapyThink',
  description: '240 本哲学书，按六个维度、难度、地区和标签筛选。',
};

export default function BooksPage() {
  return <BookLibrary />;
}
