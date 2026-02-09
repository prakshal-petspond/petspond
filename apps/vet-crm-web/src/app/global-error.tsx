'use client';

/**
 * Root error boundary. Replaces root layout when triggered.
 * Custom implementation avoids Next.js internal _error prerender bug (useRef of null).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: '#64748b', marginBottom: 16 }}>{error.message}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
