import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { DemoAuthProvider } from '@/components/DemoAuthProvider';
import { AuthErrorBoundary } from '@/components/AuthErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'FPL Optimizer',
  description: 'Optimize your Fantasy Premier League team with AI-powered predictions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <AuthErrorBoundary>
          <AuthProvider>
            <DemoAuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </DemoAuthProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
