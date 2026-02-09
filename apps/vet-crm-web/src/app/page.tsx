import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-primary mb-4">Petspond Vet CRM</h1>
      <p className="text-foreground-muted mb-8">Veterinary practice management</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-[var(--color-primary-hover)]"
      >
        Dashboard
      </Link>
    </main>
  );
}
