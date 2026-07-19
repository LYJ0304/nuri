import type { Metadata } from 'next';
import './styles.css';
import { AuthProvider } from './auth-provider';

export const metadata: Metadata = {
  title: 'Nuri | 상담 기록을 더 간결하게',
  description: 'AI와 함께 상담 기록을 정리하는 안전한 워크스페이스',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
