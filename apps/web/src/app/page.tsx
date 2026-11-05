import { ThemeSwitcher } from '@smart-parking/ui-web';
import Link from 'next/link';
import { HealthStatus } from '@/components/health-status';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[720px] flex-col justify-center gap-8 px-4 py-16 sm:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-label text-ink-muted">Metro Manila Smart Parking</p>
        <h1 className="text-h1">Operator and platform workspace</h1>
        <p className="text-ink-muted">
          Foundation build. Sign-in, organizations and facilities are not available yet.
        </p>
      </header>
      <HealthStatus />
      <ThemeSwitcher />
      <Link
        href="/design"
        className="text-compact text-ink underline-offset-4 hover:underline focus-visible:underline"
      >
        View design system components
      </Link>
    </main>
  );
}
