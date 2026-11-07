'use client';

import React from 'react';
import { Clock, User, ArrowRight, SkipForward } from 'lucide-react';
import { Button } from '../ui/Button';

interface TurnBannerProps {
  activePlayerName: string;
  nextPlayerName?: string;
  timeRemaining?: number;
  totalTime?: number;
  roundNumber?: number;
  onSkipTurn?: () => void;
  canSkip?: boolean;
}

export const TurnBanner: React.FC<TurnBannerProps> = ({
  activePlayerName,
  nextPlayerName,
  timeRemaining,
  roundNumber,
  onSkipTurn,
  canSkip = false,
}) => {
  const isUrgent = timeRemaining !== undefined && timeRemaining <= 10;

  return (
    <div className="w-full bg-surface-900 border border-surface-750 rounded-[14px_4px_16px_5px] p-3 mb-4 flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 border border-surface-700 bg-surface-850 rounded-[6px_12px_5px_10px] flex items-center justify-center text-accent-yellow font-mono text-xs font-bold">
          &gt;_
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-500">
            <span>Current Turn</span>
            {roundNumber && <span>[R{roundNumber}]</span>}
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {activePlayerName}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {nextPlayerName && (
          <div className="hidden xs:flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <span>next:</span>
            <span className="text-slate-200">{nextPlayerName}</span>
          </div>
        )}

        {timeRemaining !== undefined && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono font-bold text-xs border ${
              isUrgent
                ? 'border-accent-red bg-accent-red/20 text-accent-red'
                : 'border-surface-700 bg-surface-950 text-slate-300'
            }`}
          >
            <Clock size={12} className={isUrgent ? 'text-rose-400 animate-spin' : 'text-slate-500'} />
            <span>{timeRemaining}s</span>
          </div>
        )}

        {canSkip && onSkipTurn && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSkipTurn}
            className="text-xs text-slate-400 hover:text-rose-300 px-2 py-1 min-h-[36px]"
            title="Skip Turn"
          >
            <SkipForward size={13} />
            <span className="hidden sm:inline ml-1">Skip</span>
          </Button>
        )}
      </div>
    </div>
  );
};
