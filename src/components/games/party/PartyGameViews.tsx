'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../../../lib/types/room';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { TurnBanner } from '../../common/TurnBanner';
import {
  Sparkles,
  Flame,
  Volume2,
  Check,
  X,
  Send,
  HelpCircle,
  Paintbrush,
  RotateCcw,
  AlertTriangle,
  Music,
} from 'lucide-react';

// =============================================================
// 1. DUMB CHARADES VIEW
// =============================================================
export const CharadesView: React.FC<{
  state: any;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (a: any) => void;
}> = ({ state, players, myPlayerId, isHost, onAction }) => {
  const isActor = state.activeActorId === myPlayerId;
  const actor = players.find(p => p.id === state.activeActorId);

  return (
    <Card className="max-w-xl mx-auto p-6 space-y-6 text-center">
      <Badge variant="purple" size="md">
        DUMB CHARADES
      </Badge>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-slate-100">
          {actor?.name}&apos;s Turn to Act!
        </h3>
        <p className="text-xs text-slate-400">
          Act out the title without speaking or lip-syncing.
        </p>
      </div>

      <div className="p-6 bg-surface-900 border border-surface-750 scribble-card">
        {isActor ? (
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-accent-yellow font-semibold">
              Acting Prompt ({state.category})
            </span>
            <div className="text-3xl font-black text-white">{state.secretPrompt}</div>
          </div>
        ) : (
          <div className="py-4 text-sm font-mono text-slate-500">
            Prompt hidden! Watch {actor?.name} act it out!
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Button
          size="lg"
          onClick={() => onAction({ type: 'GUESSED_CORRECT' })}
          className="flex items-center gap-2"
        >
          <Check size={18} />
          <span>Someone Guessed It! (+1 pt)</span>
        </Button>
      </div>
    </Card>
  );
};

// =============================================================
// 2. TABOO VIEW
// =============================================================
export const TabooView: React.FC<{
  state: any;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (a: any) => void;
}> = ({ state, players, myPlayerId, isHost, onAction }) => {
  const isClueGiver = state.activeClueGiverId === myPlayerId;
  const giver = players.find(p => p.id === state.activeClueGiverId);
  const card = state.card;

  return (
    <Card className="max-w-xl mx-auto p-6 space-y-6 text-center">
      <div className="flex items-center justify-between border-b border-surface-750 pb-3">
        <Badge variant="rose" size="md">
          TABOO
        </Badge>
        <span className="font-mono text-sm text-slate-300 font-bold">
          Score: {state.score} pts
        </span>
      </div>

      {card && (
        <div className="p-6 rounded-2xl bg-surface-900 border-2 border-surface-700/80 space-y-5 shadow-card">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-accent-sky tracking-wider">
              Target Word
            </span>
            <h2 className="text-4xl font-black text-white">{card.word}</h2>
          </div>

          <div className="space-y-2 pt-3 border-t border-surface-800">
            <span className="text-xs font-mono uppercase text-rose-400 font-semibold flex items-center justify-center gap-1">
              <AlertTriangle size={14} /> FORBIDDEN WORDS
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {card.forbiddenWords.map((w: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/30 border border-rose-900/60 text-rose-200 text-sm font-semibold font-mono"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          size="lg"
          variant="danger"
          onClick={() => onAction({ type: 'NEXT_WORD', payload: { guessed: false } })}
          className="flex items-center justify-center gap-2"
        >
          <X size={18} />
          <span>Taboo Buzzer!</span>
        </Button>

        <Button
          size="lg"
          variant="primary"
          onClick={() => onAction({ type: 'NEXT_WORD', payload: { guessed: true } })}
          className="flex items-center justify-center gap-2"
        >
          <Check size={18} />
          <span>Guessed (+1)</span>
        </Button>
      </div>
    </Card>
  );
};

// =============================================================
// 3. PICTIONARY VIEW
// =============================================================
export const PictionaryView: React.FC<{
  state: any;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (a: any) => void;
}> = ({ state, players, myPlayerId, isHost, onAction }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const isArtist = state.activeArtistId === myPlayerId;
  const artist = players.find(p => p.id === state.activeArtistId);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isArtist) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isArtist) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-surface-750 pb-2">
        <div>
          <Badge variant="blue" size="md">
            PICTIONARY
          </Badge>
          <span className="text-xs text-slate-400 ml-2">Artist: {artist?.name}</span>
        </div>
        {isArtist && (
          <div className="text-sm font-bold text-accent-green">
            Secret Word: {state.secretWord}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-surface-700 bg-surface-950 overflow-hidden flex justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="w-full max-w-[500px] h-[320px] bg-surface-950 cursor-crosshair touch-none"
        />
      </div>

      {isArtist && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            {['#ffffff', '#a78bfa', '#38bdf8', '#f43f5e', '#fbbf24'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border ${
                  color === c ? 'border-white scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <RotateCcw size={14} className="mr-1" /> Clear
          </Button>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button size="md" onClick={() => onAction({ type: 'CORRECT_GUESS' })}>
          Word Guessed Correctly!
        </Button>
      </div>
    </Card>
  );
};

// =============================================================
// 4. MAJORITY RULES VIEW
// =============================================================
export const MajorityRulesView: React.FC<{
  state: any;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (a: any) => void;
}> = ({ state, players, myPlayerId, isHost, onAction }) => {
  const [answerInput, setAnswerInput] = useState('');
  const hasSubmitted = state.submissions[myPlayerId] !== undefined;

  return (
    <Card className="max-w-xl mx-auto p-6 space-y-6 text-center">
      <Badge variant="purple" size="md">
        MAJORITY RULES
      </Badge>

      <div className="space-y-2">
        <span className="text-xs font-mono uppercase text-slate-500">Group Prompt</span>
        <h2 className="text-2xl font-black text-slate-100">{state.question}</h2>
        <p className="text-xs text-slate-400">
          Try to guess what the majority of your friends will answer!
        </p>
      </div>

      {state.phase === 'SUBMITTING' && (
        <div className="space-y-3 max-w-sm mx-auto">
          {hasSubmitted ? (
            <div className="p-4 bg-surface-900 rounded-xl border border-surface-750 text-xs text-slate-400">
              Answer submitted: <strong className="text-white">&ldquo;{state.submissions[myPlayerId]}&rdquo;</strong>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Waiting for {players.length - Object.keys(state.submissions).length} players...
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                placeholder="Type your answer..."
                className="w-full bg-surface-900 border border-surface-700 scribble-input px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-accent-yellow"
              />
              <Button
                size="md"
                variant="primary"
                disabled={!answerInput.trim()}
                onClick={() => {
                  onAction({
                    type: 'SUBMIT_ANSWER',
                    payload: { playerId: myPlayerId, answer: answerInput.trim() },
                  });
                }}
                className="w-full"
              >
                Submit Private Answer
              </Button>
            </>
          )}
        </div>
      )}

      {state.phase === 'REVEAL' && (
        <div className="space-y-4">
          <div className="p-4 scribble-card bg-surface-900 border border-surface-750">
            <span className="text-[10px] font-mono uppercase text-accent-yellow block mb-1 font-semibold">
              Majority Consensus
            </span>
            <div className="text-2xl font-bold text-white capitalize">
              {state.majorityAnswer || 'No Majority'}
            </div>
          </div>

          <div className="space-y-2 text-left">
            <span className="text-xs font-mono uppercase text-slate-500">All Submissions:</span>
            {players.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded bg-surface-900 text-xs border border-surface-800"
              >
                <span className="font-semibold text-slate-300">{p.name}</span>
                <span className="text-slate-100">&ldquo;{state.submissions[p.id]}&rdquo;</span>
                {state.scores?.[p.id] > 0 && (
                  <Badge variant="yellow" size="sm">+2 pts</Badge>
                )}
              </div>
            ))}
          </div>

          {isHost && (
            <Button size="md" variant="primary" onClick={() => onAction({ type: 'NEXT_ROUND' })}>
              Next Question
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

// =============================================================
// 5. WHO'S MOST LIKELY TO VIEW
// =============================================================
export const MostLikelyView: React.FC<{
  state: any;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (a: any) => void;
}> = ({ state, players, myPlayerId, isHost, onAction }) => {
  const hasVoted = state.votes[myPlayerId] !== undefined;

  return (
    <Card className="max-w-xl mx-auto p-6 space-y-6 text-center">
      <Badge variant="blue" size="md">
        WHO&apos;S MOST LIKELY TO
      </Badge>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-100">{state.prompt}</h2>
        <p className="text-xs text-slate-400">Vote for the person in the room who fits this best.</p>
      </div>

      {state.phase === 'VOTING' && (
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
          {players.map(p => (
            <button
              key={p.id}
              disabled={hasVoted}
              onClick={() => onAction({ type: 'SUBMIT_VOTE', payload: { voterId: myPlayerId, targetId: p.id } })}
              className={`p-3 scribble-card text-sm font-semibold transition-all ${
                state.votes[myPlayerId] === p.id
                  ? 'bg-accent-yellow/20 border-accent-yellow text-white shadow-sm'
                  : 'bg-surface-900 border-surface-750 text-slate-200 hover:bg-surface-800 hover:border-accent-yellow/60 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {state.phase === 'REVEAL' && (
        <div className="space-y-3">
          <h4 className="text-sm font-mono uppercase text-slate-400">Vote Breakdown:</h4>
          <div className="space-y-1.5 text-left max-w-sm mx-auto">
            {players.map(p => {
              const count = Object.values(state.votes).filter(id => id === p.id).length;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded bg-surface-900 border border-surface-800 text-xs"
                >
                  <span className="font-semibold text-slate-200">{p.name}</span>
                  <Badge variant={count > 0 ? 'purple' : 'slate'} size="sm">
                    {count} votes
                  </Badge>
                </div>
              );
            })}
          </div>
          {isHost && (
            <Button size="md" onClick={() => onAction({ type: 'NEXT_QUESTION' })}>
              Next Question
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

