'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 scribble-card border-surface-700 flex items-center justify-center text-accent-green mb-4">
        <span className="font-mono text-xl font-bold">404</span>
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
        The room code or page you are looking for doesn&apos;t exist or the session has ended.
      </p>
      <Link href="/">
        <Button size="md" className="flex items-center gap-2">
          <ArrowLeft size={16} />
          <span>Return Home</span>
        </Button>
      </Link>
    </div>
  );
}

