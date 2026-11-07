'use client';

import React, { useEffect, useState } from 'react';
import { ForeheadGameState } from '../../../lib/types/game';
import { Player } from '../../../lib/types/room';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Check, X, RotateCcw, Smartphone, Compass } from 'lucide-react';

interface ForeheadGameViewProps {
  state: ForeheadGameState;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (action: { type: string; payload?: any }) => void;
  playStyle: string;
}

export const ForeheadGameView: React.FC<ForeheadGameViewProps> = ({
  state,
  players,
  myPlayerId,
  isHost,
  onAction,
  playStyle,
}) => {
  const [tiltActive, setTiltActive] = useState(false);
  const guesserPlayer = players.find(p => p.id === state.activeGuesserId);

  // Device tilt detection (DeviceOrientation API)
  useEffect(() => {
    let lastTiltTime = 0;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (state.phase !== 'PLAYING') return;
      const now = Date.now();
      if (now - lastTiltTime < 1200) return; // Debounce 1.2s

      const gamma = e.gamma;
      if (gamma !== null && gamma !== undefined) {
        if (gamma < -35) {
          lastTiltTime = now;
          onAction({ type: 'CORRECT' });
        } else if (gamma > 35) {
          lastTiltTime = now;
          onAction({ type: 'SKIP' });
        }
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent && state.phase === 'PLAYING') {
      window.addEventListener('deviceorientation', handleOrientation);
      setTiltActive(true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [state.phase, onAction]);

  const requestSensorPermission = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setTiltActive(true);
        }
      } catch (err) {
        console.warn('Orientation permission notice:', err);
      }
    }
  };

  // 1. PRE-ROUND VIEW
  if (state.phase === 'PRE_ROUND') {
    return (
      <div className="w-full max-w-md mx-auto py-6 text-center space-y-5 px-3">
        <div className="w-16 h-16 border-2 border-dashed border-accent-yellow/40 rounded-[14px_4px_16px_5px] bg-accent-yellow/10 flex items-center justify-center text-accent-yellow mx-auto">
          <Smartphone size={32} />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-mono uppercase text-accent-yellow font-bold block">
            Forehead Frenzy
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
            {guesserPlayer?.name}&apos;s Turn!
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
            Hold phone against your forehead facing friends. Guess based on their hints!
          </p>
        </div>

        <div className="p-3.5 bg-surface-900 border border-surface-750 rounded-[12px_4px_14px_4px] max-w-xs mx-auto text-left text-xs text-slate-300 space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Duration:</span>
            <span className="font-bold text-slate-100">{state.totalTime}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Skips allowed:</span>
            <span className="font-bold text-slate-100">{state.passesLeft}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tilt down:</span>
            <span className="text-accent-green font-semibold">Correct (+1)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tilt up:</span>
            <span className="text-slate-400">Skip (0)</span>
          </div>
        </div>

        <div className="space-y-2 pt-1 max-w-xs mx-auto">
          <Button
            size="xl"
            onClick={() => {
              requestSensorPermission();
              onAction({ type: 'START_ROUND' });
            }}
            className="w-full"
          >
            Start Guessing
          </Button>

          <button
            onClick={requestSensorPermission}
            className="flex items-center justify-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-300 mx-auto pt-1"
          >
            <Compass size={11} />
            <span>Enable Tilt Sensors (Forehead Mode)</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE PLAYING VIEW (Full mobile bleed, distance readable)
  if (state.phase === 'PLAYING') {
    const isUrgent = state.timeRemaining <= 10;

    return (
      <div className="fixed inset-0 z-50 bg-surface-950 flex flex-col justify-between p-4 select-none touch-none">
        {/* Top Minimal Bar */}
        <div className="flex items-center justify-between border-b border-dashed border-surface-800 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-3xl font-mono font-black ${
                isUrgent ? 'text-accent-red animate-ping' : 'text-slate-100'
              }`}
            >
              {state.timeRemaining}s
            </span>
            {state.currentStreak >= 2 && (
              <span className="text-xs font-mono text-accent-yellow font-bold border border-accent-yellow/40 px-1.5 py-0.5 rounded">
                +{state.currentStreak} streak
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-slate-200">
              Score: {state.roundScore}
            </span>
            <button
              onClick={() => onAction({ type: 'END_ROUND' })}
              className="text-xs font-mono text-slate-500 hover:text-white px-2 py-1 border border-surface-800 rounded"
            >
              [Stop]
            </button>
          </div>
        </div>

        {/* Center Big Bold Word */}
        <div className="my-auto text-center px-2 py-4">
          <span className="text-xs font-mono uppercase tracking-widest text-accent-yellow mb-2 block font-semibold">
            {state.currentWord?.category.replace('_', ' ')}
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight">
            {state.currentWord?.text || 'Ready!'}
          </h1>
          {state.currentWord?.difficulty === 'hard' && (
            <span className="inline-block mt-3 text-[11px] font-mono text-accent-sky border border-accent-sky/40 px-2 py-0.5 rounded">
              [Hard Word: +2 pts]
            </span>
          )}
        </div>

        {/* Bottom Tactile Touch Controls */}
        <div className="grid grid-cols-2 gap-3 pb-1">
          <button
            onClick={() => onAction({ type: 'SKIP' })}
            disabled={state.passesLeft <= 0}
            className="h-20 sm:h-24 rounded-[14px_4px_16px_5px] bg-surface-900 border-2 border-surface-700 active:bg-surface-850 flex flex-col items-center justify-center gap-0.5 text-slate-300 disabled:opacity-30 scribble-btn"
          >
            <div className="flex items-center gap-1.5">
              <X size={20} className="text-slate-400" />
              <span className="text-base font-bold font-mono">SKIP</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              ({state.passesLeft} left)
            </span>
          </button>

          <button
            onClick={() => onAction({ type: 'CORRECT' })}
            className="h-20 sm:h-24 rounded-[14px_4px_16px_5px] bg-accent-green/20 border-2 border-accent-green active:bg-accent-green/30 flex flex-col items-center justify-center gap-0.5 text-white scribble-btn shadow-glow"
          >
            <div className="flex items-center gap-1.5">
              <Check size={22} className="text-accent-green" />
              <span className="text-base font-bold font-mono">CORRECT</span>
            </div>
            <span className="text-[10px] text-accent-green font-mono font-semibold">+1 pt</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. ROUND SUMMARY VIEW
  return (
    <Card className="max-w-md mx-auto p-5 space-y-4 text-center">
      <span className="text-xs font-mono uppercase text-accent-yellow font-bold block">
        Round Complete
      </span>

      <div className="space-y-0.5">
        <h2 className="text-2xl font-black text-slate-100">
          {guesserPlayer?.name} Scored {state.roundScore} pts!
        </h2>
        <p className="text-xs text-slate-400">
          Guessed {state.guessedWords.filter(w => w.correct).length} of {state.guessedWords.length} words
        </p>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 bg-surface-950 rounded-[10px_3px_12px_3px] border border-surface-800 text-left">
        {state.guessedWords.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-1.5 rounded bg-surface-900 border border-surface-850 text-xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              {item.correct ? (
                <Check size={13} className="text-accent-green flex-shrink-0" />
              ) : (
                <X size={13} className="text-slate-600 flex-shrink-0" />
              )}
              <span className={item.correct ? 'font-medium text-slate-200 truncate' : 'text-slate-600 line-through truncate'}>
                {item.word.text}
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 flex-shrink-0 ml-2">
              {item.correct ? `+${item.points}` : '0'}
            </span>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={() => onAction({ type: 'START_ROUND' })}
        className="w-full"
      >
        <RotateCcw size={15} className="mr-1.5" />
        <span>Next Round</span>
      </Button>
    </Card>
  );
};
