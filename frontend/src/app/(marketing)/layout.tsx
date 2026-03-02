import type { Metadata } from 'next';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'FPL Optimizer - Dominate Your Fantasy League',
  description: 'AI-powered Fantasy Premier League optimization. Predict player performance, find optimal transfers, and win your mini-leagues.',
  keywords: 'FPL, Fantasy Premier League, optimizer, AI predictions, football, fantasy football',
  openGraph: {
    title: 'FPL Optimizer - Dominate Your Fantasy League',
    description: 'AI-powered Fantasy Premier League optimization',
    type: 'website',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-fpl-green via-fpl-purple to-fpl-green">
      <Header variant="marketing" />
      <main>{children}</main>
    </div>
  );
}
