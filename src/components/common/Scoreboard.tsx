'use client';

import React from 'react';
import { Player } from '../../lib/types/room';
import { Trophy, Crown, WifiOff } from 'lucide-react';
import { Card } from '../ui/Card';

interface ScoreboardProps {
  players: Player[];
  currentRound?: number;
  totalRounds?: number;
  highlightPlayerId?: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  players,
  currentRound,
  totalRounds,
  highlightPlayerId,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Card className="w-full">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-dashed border-surface-750">
        <div className="flex items-center gap-1.5">
          <Trophy size={14} className="text-amber-400" />
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Leaderboard
          </h4>
        </div>
        {currentRound && (
          <span className="font-mono text-[10px] text-slate-500">
            [ROUND {currentRound}{totalRounds ? `/${totalRounds}` : ''}]
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {sortedPlayers.map((player, idx) => {
          const isLeader = idx === 0 && player.score > 0;
          const isHighlight = player.id === highlightPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-[8px_3px_9px_3px] transition-all border ${
                isHighlight
                  ? 'bg-accent-yellow/15 border-accent-yellow/50 text-white'
                  : 'bg-surface-950/70 border-surface-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-center text-xs font-mono font-bold text-slate-500">
                  #{idx + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-none">
                    {player.name}
                  </span>
                  {player.isHost && (
                    <span title="Host">
                      <Crown size={11} className="text-amber-400" />
                    </span>
                  )}
                  {!player.isConnected && (
                    <span title="Disconnected">
                      <WifiOff size={11} className="text-rose-400" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLeader && (
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    *LEAD*
                  </span>
                )}
                <span className="font-mono text-xs font-bold text-slate-100">
                  {player.score} <span className="text-[9px] text-slate-500">pts</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
