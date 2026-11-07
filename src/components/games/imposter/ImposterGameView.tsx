'use client';

import React, { useState } from 'react';
import { ImposterGameState } from '../../../lib/types/game';
import { Player } from '../../../lib/types/room';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { TurnBanner } from '../../common/TurnBanner';
import { Eye, EyeOff, ShieldAlert, Vote, CheckCircle, ArrowRight } from 'lucide-react';

interface ImposterGameViewProps {
  state: ImposterGameState;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (action: { type: string; payload?: any }) => void;
  playStyle: string;
}

export const ImposterGameView: React.FC<ImposterGameViewProps> = ({
  state,
  players,
  myPlayerId,
  isHost,
  onAction,
  playStyle,
}) => {
  const [showRole, setShowRole] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);

  const isImposter = state.imposterId === myPlayerId;
  const activeSpeakerId = state.speakingOrder[state.activeSpeakerIndex];
  const activeSpeaker = players.find((p) => p.id === activeSpeakerId);
  const nextSpeakerId =
    state.speakingOrder[(state.activeSpeakerIndex + 1) % state.speakingOrder.length];
  const nextSpeaker = players.find((p) => p.id === nextSpeakerId);

  const hasVoted = state.votes[myPlayerId] !== undefined;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Turn Banner during clue phase */}
      {state.phase === 'CLUE_GIVING' && (
        <TurnBanner
          activePlayerName={activeSpeaker?.name || 'Unknown'}
          nextPlayerName={nextSpeaker?.name}
          roundNumber={state.clueRound}
          onSkipTurn={() => onAction({ type: 'NEXT_SPEAKER' })}
          canSkip={isHost || myPlayerId === activeSpeakerId}
        />
      )}

      {/* 1. ROLE REVEAL / PEEK CARD */}
      <Card className="border border-surface-700 bg-surface-900">
        <div className="flex items-center justify-between pb-3 border-b border-surface-750/70 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-slate-400 font-medium">Category:</span>
            <span className="text-xs font-semibold text-accent-green">
              {state.category.replace(/_/g, ' ')}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRole(!showRole)}
            className="text-xs px-3"
          >
            {showRole ? <EyeOff size={14} className="mr-1.5" /> : <Eye size={14} className="mr-1.5" />}
            <span>{showRole ? 'Hide' : 'Peek Secret'}</span>
          </Button>
        </div>

        {showRole ? (
          <div className="py-4 text-center space-y-2 animate-in fade-in duration-150">
            {isImposter ? (
              <div className="space-y-2">
                <div className="inline-flex p-3 scribble-card bg-accent-red/15 text-accent-red border-accent-red/40 mb-1">
                  <ShieldAlert size={28} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-accent-red tracking-tight">
                  You are the Imposter
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Listen carefully to others&apos; clues, give a believable hint, and do not get voted out.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-accent-green block">
                  Secret Word
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {state.secretWord}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1 leading-relaxed">
                  Give a subtle clue that proves you know the secret without making it obvious to the imposter.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">
            Tap &ldquo;Peek Secret&rdquo; to view your role privately
          </div>
        )}

        {state.phase === 'ROLE_REVEAL' && isHost && (
          <div className="mt-3 pt-3 border-t border-surface-750/70 flex justify-end">
            <Button
              size="md"
              onClick={() => onAction({ type: 'START_CLUES' })}
              className="w-full sm:w-auto font-semibold"
            >
              <span>Begin Clues</span>
              <ArrowRight size={15} className="ml-1" />
            </Button>
          </div>
        )}
      </Card>

      {/* 2. CLUE GIVING PHASE */}
      {state.phase === 'CLUE_GIVING' && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-surface-750/70 pb-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Speaking Order (Round {state.clueRound}/{state.maxClueRounds})
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {state.speakingOrder.map((playerId, idx) => {
              const p = players.find((x) => x.id === playerId);
              const isCurrent = idx === state.activeSpeakerIndex;
              const hasSpoken = idx < state.activeSpeakerIndex;

              return (
                <div
                  key={playerId}
                  className={`p-3 scribble-card text-xs flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                      : hasSpoken
                      ? 'border-surface-800 bg-surface-950 text-slate-600 line-through'
                      : 'border-surface-750 bg-surface-900 text-slate-300'
                  }`}
                >
                  <span className="font-mono text-[11px] text-slate-500">#{idx + 1}</span>
                  <span className="truncate mx-1">{p?.name || 'Player'}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-accent-yellow font-semibold">Speaking</span>
                  )}
                </div>
              );
            })}
          </div>

          {(isHost || myPlayerId === activeSpeakerId) && (
            <div className="pt-2">
              <Button
                size="lg"
                variant="primary"
                onClick={() => onAction({ type: 'NEXT_SPEAKER' })}
                className="w-full flex items-center justify-center gap-2 text-base font-semibold"
              >
                <span>Next Speaker</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 3. DISCUSSION PHASE */}
      {state.phase === 'DISCUSSION' && (
        <Card className="text-center py-6 space-y-4">
          <span className="text-xs uppercase text-accent-yellow font-semibold tracking-wider block">
            Open Discussion
          </span>
          <h3 className="text-xl font-bold text-slate-100">
            Who seems suspicious?
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Interrogate suspects. Who hesitated or gave an overly vague clue?
          </p>

          {isHost && (
            <div className="pt-2 flex justify-center">
              <Button
                size="lg"
                variant="primary"
                onClick={() => onAction({ type: 'START_VOTING' })}
                className="w-full sm:w-auto font-semibold"
              >
                <Vote size={16} className="mr-2" />
                <span>Open Voting Phase</span>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 4. VOTING PHASE */}
      {state.phase === 'VOTING' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-750/70">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Cast Your Vote</h4>
              <p className="text-xs text-slate-400">Vote for who you believe is the Imposter.</p>
            </div>
            <span className="text-xs text-accent-red font-semibold uppercase">
              Vote
            </span>
          </div>

          {hasVoted ? (
            <div className="p-6 text-center space-y-2 bg-surface-950 scribble-card border border-surface-750">
              <CheckCircle size={28} className="mx-auto text-accent-green" />
              <h5 className="text-sm font-semibold text-slate-200">Vote Cast</h5>
              <p className="text-xs text-slate-500 font-mono">
                Waiting for others... ({Object.keys(state.votes).length}/{players.length})
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => {
                const isSelected = selectedVoteId === p.id;
                const isMe = p.id === myPlayerId;

                return (
                  <button
                    key={p.id}
                    disabled={isMe}
                    onClick={() => setSelectedVoteId(p.id)}
                    className={`p-3.5 scribble-card text-left transition-colors min-h-[52px] ${
                      isSelected
                        ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                        : isMe
                        ? 'opacity-30 border-surface-800 bg-surface-950 cursor-not-allowed'
                        : 'border-surface-750 bg-surface-950 text-slate-300 hover:border-accent-yellow/70 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {isMe ? '(You)' : isSelected ? 'Selected' : 'Tap to select'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!hasVoted && selectedVoteId && (
            <Button
              size="lg"
              onClick={() => {
                onAction({
                  type: 'SUBMIT_VOTE',
                  payload: { voterId: myPlayerId, votedPlayerId: selectedVoteId },
                });
              }}
              className="w-full text-base font-semibold"
            >
              Confirm Vote
            </Button>
          )}
        </Card>
      )}

      {/* 5. VOTE REVEAL & TIED VOTE */}
      {state.phase === 'VOTE_REVEAL' && (
        <Card className="text-center py-6 space-y-4">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
            Vote Results
          </span>
          {state.isTie ? (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-100">The Vote is Tied!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                No single player had the most votes. Discuss and revote.
              </p>
              {isHost && (
                <Button
                  size="md"
                  onClick={() => onAction({ type: 'START_VOTING' })}
                  className="w-full sm:w-auto font-semibold"
                >
                  Revote Now
                </Button>
              )}
            </div>
          ) : null}
        </Card>
      )}

      {/* 6. IMPOSTER FINAL GUESS PHASE */}
      {state.phase === 'IMPOSTER_GUESS' && (
        <Card className="p-6 border border-accent-red/40 bg-surface-900 space-y-4 text-center">
          <span className="text-xs font-semibold text-accent-red uppercase tracking-wider block">
            Imposter Identified
          </span>
          <h3 className="text-lg font-bold text-slate-100">
            {players.find((p) => p.id === state.imposterId)?.name} was caught!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Final chance: If the imposter correctly guesses the secret word, they steal the victory!
          </p>

          {isImposter ? (
            <div className="max-w-xs mx-auto space-y-3 pt-2">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type the secret word..."
                className="w-full bg-surface-950 border border-surface-700 scribble-input px-4 py-3 min-h-[52px] text-base text-slate-100 focus:outline-none focus:border-accent-yellow"
              />
              <Button
                size="lg"
                variant="primary"
                disabled={!guessInput.trim()}
                onClick={() => {
                  onAction({
                    type: 'SUBMIT_IMPOSTER_GUESS',
                    payload: { guess: guessInput.trim() },
                  });
                }}
                className="w-full text-base font-semibold"
              >
                Submit Guess
              </Button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-2">
              Waiting for imposter to attempt a word guess...
            </div>
          )}
        </Card>
      )}

      {/* 7. ROUND OVER SUMMARY */}
      {state.phase === 'ROUND_OVER' && (
        <Card className="p-6 text-center space-y-4 border border-surface-700 bg-surface-900">
          <span
            className={`text-xs font-semibold uppercase tracking-wider block ${
              state.innocentsWon ? 'text-accent-green' : 'text-accent-red'
            }`}
          >
            {state.innocentsWon ? 'Innocents Win' : 'Imposter Wins'}
          </span>

          <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
            {state.innocentsWon
              ? 'The Innocents Unmasked the Imposter!'
              : 'The Imposter Fooled Everyone!'}
          </h3>

          <div className="p-4 scribble-card bg-surface-950 border border-surface-700 max-w-xs mx-auto space-y-1">
            <span className="text-xs uppercase text-slate-500 block">The Secret Word</span>
            <div className="text-xl font-bold text-accent-green">{state.secretWord}</div>
            <div className="text-xs text-slate-400 pt-1">
              Imposter: <strong>{players.find((p) => p.id === state.imposterId)?.name}</strong>
            </div>
          </div>

          {isHost && (
            <Button
              size="lg"
              variant="primary"
              onClick={() => onAction({ type: 'START_GAME' })}
              className="w-full sm:w-auto font-semibold"
            >
              Play Next Round
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
