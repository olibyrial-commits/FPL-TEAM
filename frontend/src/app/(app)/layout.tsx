import { Header } from '@/components/Header';

export const metadata = {
  title: 'FPL Optimizer - Dashboard',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-fpl-green via-fpl-purple to-fpl-green">
      <Header variant="app" />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
