import { Suspense } from 'react';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';

function LoginSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-20 w-20 rounded-lg mx-auto" />
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-2/3 mx-auto" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
