'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/ui/Button';
import {
  Smartphone,
  Wifi,
  Eye,
  Gavel,
  Flame,
  Shield,
  Sparkles,
  ArrowRight,
  Users,
  Compass,
} from 'lucide-react';

interface GameInfo {
  id: string;
  title: string;
  vibe: string;
  players: string;
  device: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  accent: 'green' | 'red';
  featured?: boolean;
}

const GAMES: GameInfo[] = [
  {
    id: 'IMPOSTER',
    title: 'Imposter',
    vibe: 'Social Deduction',
    players: '3–10 players',
    device: '1 phone (Pass & Play) or Online',
    tagline: 'Find the liar before they figure out the secret word.',
    description:
      'Everyone gets the secret word except the imposter. Go around the room giving subtle one-word clues. Bluff, deduce, and vote out loud.',
    icon: Eye,
    accent: 'green',
    featured: true,
  },
  {
    id: 'FOREHEAD_FRENZY',
    title: 'Forehead Frenzy',
    vibe: 'Party Guessing',
    players: '2–10 players',
    device: '1 phone on forehead',
    tagline: 'Tilt your phone up to pass, down to score.',
    description:
      'Hold the screen against your forehead. Your friends shout clues while the clock ticks down. Tilt down when you get it right.',
    icon: Smartphone,
    accent: 'green',
  },
  {
    id: 'AUCTION_DRAFT',
    title: 'Auction Draft',
    vibe: 'Tactical Bidding',
    players: '3–8 players',
    device: 'Online separate phones',
    tagline: 'Bid credits live to assemble championship rosters.',
    description:
      'Real-time credit bidding on Football squads and Clash Royale decks. Algorithmic synergy grading crowns the best tactician.',
    icon: Gavel,
    accent: 'green',
  },
  {
    id: 'TABOO',
    title: 'Taboo',
    vibe: 'Fast Wordplay',
    players: '4–10 players',
    device: 'Teams • 1 phone',
    tagline: 'Say anything except the 5 forbidden taboo words.',
    description:
      'Describe the secret concept to your teammate as quickly as possible without uttering any of the 5 forbidden taboo words on the card.',
    icon: Shield,
    accent: 'green',
  },
  {
    id: 'DUMB_CHARADES',
    title: 'Dumb Charades',
    vibe: 'Silent Acting',
    players: '4–12 players',
    device: '1 phone',
    tagline: 'Act out Bollywood films and iconic songs in pure silence.',
    description:
      'No talking, no mouthing words. Act out blockbuster movies, hit songs, and legendary scenes with expressive gestures.',
    icon: Flame,
    accent: 'red',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedGameId, setSelectedGameId] = useState<string>('IMPOSTER');
  const activeGame = GAMES.find((g) => g.id === selectedGameId) || GAMES[0];
  const Icon = activeGame.icon;

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto px-4 py-6 sm:py-10 w-full flex flex-col justify-between space-y-6 pb-safe">
        {/* Top Header Pitch */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 scribble-tag text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10 text-[11px] font-mono font-bold tracking-wide">
            <Sparkles size={12} />
            <span>Private Party Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            GreenPearl
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Minimal, offline-capable party games made for close friends. No sign-ups, no ads.
          </p>
        </div>

        {/* Minimal Game Stage / Showcase */}
        <div className="space-y-4">
          {/* Horizontal Game Selector Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 no-scrollbar -mx-2 px-2">
            {GAMES.map((game) => {
              const isSelected = game.id === selectedGameId;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedGameId(game.id)}
                  className={`px-3.5 py-2 whitespace-nowrap text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'scribble-btn bg-accent-yellow text-slate-950 border-accent-yellow shadow-md scale-[1.02]'
                      : 'scribble-card bg-surface-900 text-slate-300 hover:text-white hover:border-accent-yellow/70 hover:bg-surface-850'
                  }`}
                >
                  {game.title}
                </button>
              );
            })}
          </div>

          {/* Active Game Card Stage */}
          <div className="scribble-secret-card p-6 sm:p-7 space-y-5 bg-surface-900/90 relative overflow-hidden transition-all duration-200">
            {/* Game Meta & Icon */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-accent-yellow font-mono font-bold">
                    {activeGame.vibe}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {activeGame.players}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeGame.title}
                </h2>
              </div>

              <div className="w-12 h-12 scribble-card border-surface-700 bg-surface-850 flex items-center justify-center text-accent-yellow shrink-0 shadow-sm">
                <Icon size={24} />
              </div>
            </div>

            {/* Tagline & Rules Snapshot */}
            <div className="space-y-2 border-t border-surface-800/80 pt-3.5">
              <p className="text-sm font-semibold text-slate-200 leading-snug">
                {activeGame.tagline}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {activeGame.description}
              </p>
            </div>

            {/* Launch Actions */}
            <div className="pt-2 space-y-2.5">
              {activeGame.id === 'IMPOSTER' ? (
                <>
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent-yellow/10"
                    onClick={() => router.push('/local')}
                  >
                    <Smartphone size={18} />
                    <span>Pass & Play (1 Phone)</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => router.push(`/create?game=${activeGame.id}`)}
                      className="py-2.5 px-3 text-xs font-semibold text-slate-200 hover:text-white hover:border-accent-yellow hover:bg-surface-800 scribble-btn bg-surface-850 border-surface-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Wifi size={14} className="text-accent-green" />
                      <span>Create Room</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push('/join')}
                      className="py-2.5 px-3 text-xs font-semibold text-slate-200 hover:text-white hover:border-accent-yellow hover:bg-surface-800 scribble-btn bg-surface-850 border-surface-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Join with Code</span>
                    </button>
                  </div>
                </>
              ) : activeGame.id === 'TABOO' ? (
                <>
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent-yellow/10"
                    onClick={() => router.push('/taboo')}
                  >
                    <Smartphone size={18} />
                    <span>Play Taboo (1 Phone Buzzer)</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => router.push(`/create?game=${activeGame.id}`)}
                      className="py-2.5 px-3 text-xs font-semibold text-slate-200 hover:text-white hover:border-accent-yellow hover:bg-surface-800 scribble-btn bg-surface-850 border-surface-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Wifi size={14} className="text-accent-green" />
                      <span>Create Room</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push('/join')}
                      className="py-2.5 px-3 text-xs font-semibold text-slate-200 hover:text-white hover:border-accent-yellow hover:bg-surface-800 scribble-btn bg-surface-850 border-surface-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Join with Code</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent-yellow/10"
                    onClick={() => router.push(`/create?game=${activeGame.id}`)}
                  >
                    <Users size={18} />
                    <span>Start {activeGame.title}</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => router.push('/join')}
                    className="w-full py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:border-accent-yellow hover:bg-surface-850 scribble-btn bg-surface-950 border-surface-800 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Have a room code? Join Game</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Footer Navigation */}
        <div className="pt-4 border-t border-surface-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <Link
            href="/datasets"
            className="hover:text-accent-yellow transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <Compass size={14} className="text-accent-yellow" />
            <span>2,370+ words across 21 categories</span>
          </Link>

          <Link
            href="/join"
            className="hover:text-accent-yellow text-slate-500 transition-colors"
          >
            Enter Code →
          </Link>
        </div>
      </main>
    </div>
  );
}
