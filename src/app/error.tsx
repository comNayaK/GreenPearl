'use client';

import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 scribble-card border-accent-red/40 flex items-center justify-center text-accent-red mb-4">
        <span className="font-mono text-xl font-bold">!</span>
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
        An unexpected error occurred during the game session.
      </p>
      <div className="flex gap-3">
        <Button size="md" onClick={() => reset()} className="flex items-center gap-2">
          <RotateCcw size={16} />
          <span>Try again</span>
        </Button>
        <Button
          size="md"
          variant="secondary"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
        >
          Return Home
        </Button>
      </div>
    </div>
  );
}

