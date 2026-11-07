'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/common/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { io } from 'socket.io-client';

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCode = searchParams.get('code') || '';

  const [code, setCode] = useState(defaultCode.toUpperCase());
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !playerName.trim()) {
      setError('Please provide both the room code and your name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const serverUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const socket = io(serverUrl, { transports: ['websocket', 'polling'] });

      socket.on('connect', () => {
        socket.emit(
          'room:join',
          {
            code: code.trim().toUpperCase(),
            playerName: playerName.trim(),
          },
          (res: any) => {
            if (res.success && res.player) {
              sessionStorage.setItem(`room_${code.trim().toUpperCase()}_player`, JSON.stringify(res.player));
              router.push(`/room/${code.trim().toUpperCase()}`);
            } else {
              setError(res.error || 'Failed to join room.');
              setLoading(false);
            }
          }
        );
      });

      socket.on('connect_error', () => {
        setError('Cannot connect to multiplayer server.');
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

      <main className="flex-1 max-w-sm mx-auto px-4 py-8 sm:py-12 w-full space-y-6 pb-safe">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Join a Room
          </h1>
          <p className="text-sm text-slate-400">
            Enter the 6-character room code from your host.
          </p>
        </div>

        <Card className="p-5 sm:p-6 space-y-5">
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Room Code"
              value={code}
              maxLength={8}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7XKP9Q"
              className="font-mono text-center text-lg tracking-widest uppercase font-bold"
              autoFocus={!defaultCode}
            />

            <Input
              label="Your Name"
              value={playerName}
              maxLength={25}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Kabir"
              autoFocus={!!defaultCode}
            />

            {error && <p className="text-xs text-accent-red text-center">{error}</p>}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full text-base font-semibold"
            >
              Join Game
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-950 text-slate-400 flex items-center justify-center font-mono text-xs">
          Loading...
        </div>
      }
    >
      <JoinRoomContent />
    </Suspense>
  );
}
