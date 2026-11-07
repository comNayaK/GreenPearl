'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/common/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { GameModeId, PlayStyle } from '../../lib/types/room';
import { ArrowLeft, ArrowRight, Wifi, Tv } from 'lucide-react';
import { io } from 'socket.io-client';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGame = (searchParams.get('game') as GameModeId) || 'IMPOSTER';
  const initialStyle = (searchParams.get('style') as PlayStyle) || 'ONLINE';

  const [hostName, setHostName] = useState('');
  const [playStyle, setPlayStyle] = useState<PlayStyle>(initialStyle);
  const [selectedGame, setSelectedGame] = useState<GameModeId>(initialGame);
  const [hostParticipates, setHostParticipates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!hostName.trim()) {
      setError('Please enter your display name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const serverUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const socket = io(serverUrl, { transports: ['websocket', 'polling'] });

      socket.on('connect', () => {
        socket.emit(
          'room:create',
          {
            hostName: hostName.trim(),
            playStyle,
            gameMode: selectedGame,
            hostParticipates,
          },
          (res: any) => {
            if (res.success && res.code) {
              sessionStorage.setItem(`room_${res.code}_player`, JSON.stringify(res.player));
              router.push(`/room/${res.code}`);
            } else {
              setError(res.error || 'Failed to create room.');
              setLoading(false);
            }
          }
        );
      });

      socket.on('connect_error', () => {
        setError('Could not connect to multiplayer server.');
        setLoading(false);
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-md mx-auto px-4 py-6 sm:py-10 w-full space-y-6 pb-safe">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create an Online Room
          </h1>
          <p className="text-sm text-slate-400">
            Generate a private room code for your friends.
          </p>
        </div>

        <Card className="p-5 sm:p-6 space-y-5">
          {/* Host Name */}
          <div className="space-y-1">
            <Input
              label="Your Name"
              value={hostName}
              onChange={(e) => {
                setHostName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Rahul"
              autoFocus
            />
          </div>

          {/* Initial Game Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">
              Game Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'IMPOSTER', label: 'Imposter' },
                { id: 'FOREHEAD_FRENZY', label: 'Forehead Frenzy' },
                { id: 'AUCTION_DRAFT', label: 'Auction Draft' },
                { id: 'TABOO', label: 'Taboo' },
                { id: 'DUMB_CHARADES', label: 'Dumb Charades' },
                { id: 'PICTIONARY', label: 'Pictionary' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGame(g.id as GameModeId)}
                  className={`p-3 scribble-card text-left text-xs font-semibold transition-colors min-h-[46px] ${
                    selectedGame === g.id
                      ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                      : 'border-surface-750 bg-surface-950 text-slate-300 hover:border-accent-yellow/70 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Play Style Mode Selection */}
          <div className="space-y-2 pt-2 border-t border-surface-800">
            <label className="block text-xs font-medium text-slate-400">
              Room Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlayStyle('ONLINE')}
                className={`p-3 scribble-card text-left transition-colors ${
                  playStyle === 'ONLINE'
                    ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                    : 'border-surface-750 bg-surface-950 text-slate-400 hover:border-accent-yellow/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wifi size={16} className={playStyle === 'ONLINE' ? 'text-accent-yellow' : 'text-slate-500'} />
                  <span className="text-xs font-semibold">Standard</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Separate phones</p>
              </button>

              <button
                type="button"
                onClick={() => setPlayStyle('HYBRID')}
                className={`p-3 scribble-card text-left transition-colors ${
                  playStyle === 'HYBRID'
                    ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                    : 'border-surface-750 bg-surface-950 text-slate-400 hover:border-accent-yellow/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Tv size={16} className={playStyle === 'HYBRID' ? 'text-accent-yellow' : 'text-slate-500'} />
                  <span className="text-xs font-semibold">Hybrid TV</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Screen + phones</p>
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-accent-red text-center">{error}</p>}

          <Button
            size="lg"
            loading={loading}
            onClick={handleCreate}
            className="w-full text-base font-semibold"
          >
            Create Room
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-950 text-slate-400 flex items-center justify-center font-mono text-xs">
          Loading...
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  );
}
