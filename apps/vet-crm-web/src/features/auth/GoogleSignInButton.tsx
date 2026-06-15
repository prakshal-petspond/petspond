'use client';

import React, { useEffect, useRef } from 'react';

type GoogleSignInButtonProps = {
  onSuccess: (idToken: string) => void;
  onError?: (message: string) => void;
  label?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string },
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({ onSuccess, onError, label = 'continue_with' }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    const init = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response.credential) onSuccess(response.credential);
          else onError?.('Google sign-in failed');
        },
      });
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: label,
      });
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = init;
    script.onerror = () => onError?.('Failed to load Google sign-in');
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [label, onError, onSuccess]);

  if (!CLIENT_ID) {
    return (
      <p className="text-center text-xs text-muted">
        Set <code className="rounded bg-background px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google
        sign-in.
      </p>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
