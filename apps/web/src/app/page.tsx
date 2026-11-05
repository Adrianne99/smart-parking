import { HealthStatus } from '@/components/health-status';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[720px] flex-col justify-center gap-8 px-4 py-16 sm:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-ink-muted">Metro Manila Smart Parking</p>
        <h1 className="text-[28px] leading-[1.2] font-medium tracking-[-0.035em] sm:text-[32px]">
          Operator and platform workspace
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-muted">
          Foundation build. Sign-in, organizations and facilities are not available yet.
        </p>
      </header>
      <HealthStatus />
    </main>
  );
}
