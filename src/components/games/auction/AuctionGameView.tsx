'use client';

import React, { useState } from 'react';
import { AuctionGameState } from '../../../lib/types/game';
import { Player } from '../../../lib/types/room';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Gavel, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AuctionGameViewProps {
  state: AuctionGameState;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAction: (action: { type: string; payload?: any }) => void;
  playStyle: string;
}

export const AuctionGameView: React.FC<AuctionGameViewProps> = ({
  state,
  players,
  myPlayerId,
  isHost,
  onAction,
  playStyle,
}) => {
  const [selectedRosterPlayerId, setSelectedRosterPlayerId] = useState<string>(myPlayerId);

  const currentAsset = state.currentAsset;
  const myRoster = state.rosters[myPlayerId] || { budget: 25, assets: [] };
  const currentBidder = players.find(p => p.id === state.currentBidderId);

  const minNextBid = state.currentBidderId ? state.currentBid + 1 : state.currentBid;
  const slotsRemaining = state.targetTeamSize - (myRoster.assets.length + 1);
  const maxAffordableBid = myRoster.budget - Math.max(0, slotsRemaining);
  const canBid = myRoster.assets.length < state.targetTeamSize && maxAffordableBid >= minNextBid;

  const handleBid = (amount: number) => {
    if (amount <= maxAffordableBid) {
      onAction({
        type: 'PLACE_BID',
        payload: { bidderId: myPlayerId, amount },
      });
    }
  };

  // 1. AUCTION COMPLETE - EVALUATION VIEW
  if (state.phase === 'AUCTION_COMPLETE' && state.evaluations) {
    const activeEval = state.evaluations[selectedRosterPlayerId];

    return (
      <div className="w-full max-w-3xl mx-auto space-y-4">
        <div className="text-center py-2 space-y-1">
          <span className="text-xs font-mono font-bold text-accent-yellow block uppercase">
            Auction Complete
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
            Algorithmic Squad Evaluation
          </h2>
        </div>

        {/* Player Roster Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {players.map(p => {
            const ev = state.evaluations?.[p.id];
            const isSelected = selectedRosterPlayerId === p.id;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedRosterPlayerId(p.id)}
                className={`px-3 py-1.5 scribble-card text-xs font-mono whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'border-accent-yellow bg-accent-yellow/20 text-white font-bold'
                    : 'border-surface-750 bg-surface-900 text-slate-400 hover:border-accent-yellow/60 hover:text-white'
                }`}
              >
                <span>{p.name}</span>
                {ev && <span className="ml-1 text-accent-yellow font-bold">[{ev.totalScore}]</span>}
              </button>
            );
          })}
        </div>

        {/* Selected Evaluation */}
        {activeEval && (
          <div className="space-y-4">
            <Card className="p-4 sm:p-5 text-center space-y-3">
              <div className="flex items-center justify-between border-b border-dashed border-surface-750 pb-2">
                <span className="text-xs font-mono text-slate-400">
                  Manager: <strong className="text-white">{activeEval.playerName}</strong>
                </span>
                <span className="font-mono text-xs text-accent-yellow font-bold">
                  TIER: [{activeEval.ratingTier}]
                </span>
              </div>

              <div className="text-4xl font-black font-mono text-slate-100">
                {activeEval.totalScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">{activeEval.summary}</p>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-left font-mono text-xs">
                {[
                  { label: 'Quality', val: activeEval.breakdown.qualityScore },
                  { label: 'Position', val: activeEval.breakdown.positionBalance },
                  { label: 'Tactics', val: activeEval.breakdown.tacticalBalance },
                  { label: 'Synergy', val: activeEval.breakdown.synergyScore },
                  { label: 'Economy', val: activeEval.breakdown.valueForMoney },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-surface-950 border border-surface-800">
                    <span className="text-[10px] text-slate-500 block uppercase">{item.label}</span>
                    <span className="font-bold text-accent-sky">{item.val}%</span>
                  </div>
                ))}
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-dashed border-surface-750 text-left text-xs">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-accent-green flex items-center gap-1 font-bold">
                    <CheckCircle size={12} /> Strengths
                  </span>
                  <ul className="space-y-1 text-slate-400">
                    {activeEval.pros.map((p, i) => (
                      <li key={i} className="text-[11px]">+ {p}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-accent-red flex items-center gap-1 font-bold">
                    <AlertCircle size={12} /> Weaknesses
                  </span>
                  <ul className="space-y-1 text-slate-400">
                    {activeEval.cons.map((c, i) => (
                      <li key={i} className="text-[11px]">- {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // 2. LIVE BIDDING ARENA
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-3 scribble-card bg-surface-900 border border-surface-750 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Gavel size={16} className="text-accent-yellow" />
          <span>Lot {state.currentAssetIndex + 1}/{state.availablePool.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={13} className={state.bidTimer <= 3 ? 'text-accent-red animate-spin' : 'text-slate-400'} />
          <span className={`font-bold ${state.bidTimer <= 3 ? 'text-accent-red' : 'text-white'}`}>
            {state.bidTimer}s
          </span>
          <span className="text-slate-500 hidden xs:inline">| target: {state.targetTeamSize}</span>
        </div>
      </div>

      {/* Current Asset Card */}
      {currentAsset ? (
        <Card className="p-4 sm:p-5 space-y-4 border-2 border-accent-yellow/40">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-accent-yellow font-bold block mb-0.5">
                [{'position' in currentAsset ? currentAsset.position : currentAsset.cardType}]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentAsset.name}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {'club' in currentAsset
                  ? `${currentAsset.club} (${currentAsset.nationality})`
                  : `Elixir: ${currentAsset.elixirCost} • Target: ${currentAsset.target}`}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block">High Bid</span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-accent-yellow">
                {state.currentBid} <span className="text-xs font-normal text-slate-400">cr</span>
              </span>
              {currentBidder && (
                <span className="text-[10px] font-mono text-accent-sky block">
                  by {currentBidder.name}
                </span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          {'attributes' in currentAsset && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-dashed border-surface-750 font-mono text-center">
              {'pace' in currentAsset.attributes ? (
                <>
                  <div className="p-1 rounded bg-surface-950 border border-surface-850">
                    <span className="text-[9px] text-slate-500 block">PAC</span>
                    <span className="text-xs font-bold text-slate-200">{currentAsset.attributes.pace}</span>
                  </div>
                  <div className="p-1 rounded bg-surface-950 border border-surface-850">
                    <span className="text-[9px] text-slate-500 block">SHO</span>
                    <span className="text-xs font-bold text-slate-200">{currentAsset.attributes.shooting}</span>
                  </div>
                  <div className="p-1 rounded bg-surface-950 border border-surface-850">
                    <span className="text-[9px] text-slate-500 block">PAS</span>
                    <span className="text-xs font-bold text-slate-200">{currentAsset.attributes.passing}</span>
                  </div>
                  <div className="p-1 rounded bg-surface-950 border border-surface-850">
                    <span className="text-[9px] text-slate-500 block">DRI</span>
                    <span className="text-xs font-bold text-slate-200">{currentAsset.attributes.dribbling}</span>
                  </div>
                  <div className="p-1 rounded bg-surface-950 border border-surface-850">
                    <span className="text-[9px] text-slate-500 block">DEF</span>
                    <span className="text-xs font-bold text-slate-200">{currentAsset.attributes.defending}</span>
                  </div>
                  <div className="p-1 rounded bg-surface-950 border border-surface-850">
                    <span className="text-[9px] text-slate-500 block">PHY</span>
                    <span className="text-xs font-bold text-slate-200">{currentAsset.attributes.physical}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-1.5 rounded bg-surface-950 border border-surface-850 col-span-2">
                    <span className="text-[9px] text-slate-500 block">Synergy</span>
                    <span className="text-xs font-bold text-slate-200">{(currentAsset.attributes as any).synergyScore}</span>
                  </div>
                  <div className="p-1.5 rounded bg-surface-950 border border-surface-850 col-span-2">
                    <span className="text-[9px] text-slate-500 block">Win Con</span>
                    <span className="text-xs font-bold text-slate-200">{(currentAsset.attributes as any).winCondition ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="p-1.5 rounded bg-surface-950 border border-surface-850 col-span-2">
                    <span className="text-[9px] text-slate-500 block">Defense</span>
                    <span className="text-xs font-bold text-slate-200">{(currentAsset.attributes as any).defenseRating}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile Tactile Bidding Buttons */}
          <div className="pt-2 border-t border-dashed border-surface-750 space-y-2">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Your Budget: <strong className="text-white">{myRoster.budget} cr</strong></span>
              <span>Max: <strong className="text-accent-yellow">{maxAffordableBid} cr</strong></span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                size="lg"
                disabled={!canBid || minNextBid > maxAffordableBid}
                onClick={() => handleBid(minNextBid)}
                className="flex flex-col py-2"
              >
                <span className="text-[10px] font-mono uppercase">Bid Min</span>
                <span className="text-sm font-bold font-mono">+{minNextBid} cr</span>
              </Button>

              <Button
                size="lg"
                variant="secondary"
                disabled={!canBid || minNextBid + 2 > maxAffordableBid}
                onClick={() => handleBid(minNextBid + 2)}
                className="flex flex-col py-2"
              >
                <span className="text-[10px] font-mono uppercase">Raise +2</span>
                <span className="text-sm font-bold font-mono">+{minNextBid + 2} cr</span>
              </Button>

              <Button
                size="lg"
                variant="secondary"
                disabled={!canBid || minNextBid + 5 > maxAffordableBid}
                onClick={() => handleBid(minNextBid + 5)}
                className="flex flex-col py-2"
              >
                <span className="text-[10px] font-mono uppercase">Raise +5</span>
                <span className="text-sm font-bold font-mono">+{minNextBid + 5} cr</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center text-xs font-mono text-slate-500">
          [ Waiting for next lot... ]
        </Card>
      )}

      {/* Compact Participant Rosters Overview */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
          Squad Budgets ({state.targetTeamSize} slots each)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {players.map(p => {
            const r = state.rosters[p.id];
            if (!r) return null;
            const isMe = p.id === myPlayerId;

            return (
              <div
                key={p.id}
                className={`p-2.5 scribble-card text-xs flex items-center justify-between font-mono ${
                  isMe
                    ? 'border-accent-yellow/60 bg-accent-yellow/10 text-white'
                    : 'border-surface-800 bg-surface-950 text-slate-300'
                }`}
              >
                <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                <span className="text-[11px] text-slate-400">
                  {r.assets.length}/{state.targetTeamSize} ({r.budget} cr left)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
