import type { Metadata } from 'next';
import { ArchiveView } from '@/components/ArchiveView';

export const metadata: Metadata = {
  title: '我的记录 · 卡皮思 CapyThink',
  description: '本机的测验记录与书架：准备读、正在读、已经读完。',
};

export default function MePage() {
  return <ArchiveView />;
}
