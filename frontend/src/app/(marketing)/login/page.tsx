import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-fpl-green via-fpl-purple to-fpl-green">
      <Suspense fallback={
        <div className="w-full max-w-md flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
