'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Smartphone, Gamepad2 } from 'lucide-react';

interface NavbarProps {
  roomCode?: string;
  playStyle?: string;
  gameMode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ roomCode, playStyle, gameMode }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-750/70 bg-surface-950/90 backdrop-blur-md">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 scribble-card bg-surface-850 border border-surface-700 flex items-center justify-center text-accent-yellow text-xs font-bold group-hover:border-accent-yellow transition-colors">
            GP
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-100 group-hover:text-white transition-colors">
            GreenPearl
          </span>
        </Link>

        {roomCode && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-surface-900 border border-accent-yellow/40 text-accent-yellow font-mono font-medium scribble-tag">
              {roomCode}
            </span>
            {gameMode && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                {gameMode.replace('_', ' ')}
              </span>
            )}
          </div>
        )}

        <nav className="flex items-center gap-2">
          <Link
            href="/datasets"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-surface-850"
            title="Content Library"
          >
            <Database size={14} className="text-accent-yellow" />
            <span className="hidden xs:inline">Library</span>
          </Link>
          <Link
            href="/local"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-surface-850 hover:bg-surface-800 hover:border-accent-yellow hover:text-white border border-surface-700 scribble-btn transition-colors"
          >
            <Smartphone size={14} className="text-accent-green" />
            <span>Pass & Play</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
