'use client';

import React, { useState } from 'react';
import { Shield, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface PassPhonePrivacyCoverProps {
  targetPlayerName: string;
  roleOrContext?: string;
  children: React.ReactNode;
  onDone?: () => void;
  doneButtonText?: string;
}

export const PassPhonePrivacyCover: React.FC<PassPhonePrivacyCoverProps> = ({
  targetPlayerName,
  roleOrContext = 'your private turn',
  children,
  onDone,
  doneButtonText = 'Hide & Next Player',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!isRevealed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-5 bg-surface-950 text-center animate-fade-in select-none">
        <div className="w-full max-w-sm p-6 border-2 border-surface-700 bg-surface-900 rounded-[22px_8px_20px_10px] space-y-6">
          <div className="w-14 h-14 border-2 border-dashed border-accent-green rounded-[12px_4px_14px_6px] bg-accent-green/10 flex items-center justify-center text-accent-green mx-auto">
            <Shield size={28} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
              Privacy Shield
            </span>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Pass phone to <span className="text-accent-green underline decoration-wavy decoration-accent-green/60">{targetPlayerName}</span>
            </h2>
            <p className="text-xs text-slate-400 pt-1">
              Keep the screen hidden from everyone else before tapping reveal.
            </p>
          </div>

          <Button
            size="xl"
            onClick={() => setIsRevealed(true)}
            className="w-full flex items-center justify-center gap-2"
          >
            <UserCheck size={18} />
            <span>I am {targetPlayerName}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-4">
      <div className="p-3 bg-surface-900 border border-dashed border-surface-750 rounded-[10px_4px_12px_4px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-yellow animate-ping" />
          <span className="text-xs font-mono text-slate-300">
            Player: <strong className="text-white">{targetPlayerName}</strong> ({roleOrContext})
          </span>
        </div>
        {onDone && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsRevealed(false);
              onDone();
            }}
            className="text-xs min-h-[36px]"
          >
            <span>{doneButtonText}</span>
            <ArrowRight size={13} className="ml-1" />
          </Button>
        )}
      </div>

      {children}
    </div>
  );
};
