import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata = { title: 'Team sign in', robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-tint px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-navy/60">MMD COMMUNITY CARE</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Team sign in</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-slate-500">Loading&hellip;</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
