import type { NextPageContext } from 'next';

/**
 * Overrides Next.js legacy Pages Router error prerender, which can fail in App Router
 * monorepos with "Cannot read properties of null (reading 'useContext')".
 */
function ErrorPage({ statusCode }: { statusCode: number }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>{statusCode}</h1>
      <p style={{ color: '#64748b' }}>Something went wrong.</p>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default ErrorPage;
