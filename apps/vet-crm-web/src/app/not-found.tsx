import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <h1 className="text-2xl font-bold mb-2">404</h1>
      <p className="text-muted mb-6">This page could not be found.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90"
      >
        Go home
      </Link>
    </main>
  );
}
