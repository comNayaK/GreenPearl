'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '../../../components/common/Navbar';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Scoreboard } from '../../../components/common/Scoreboard';
import { RoomState, GameModeId, Player } from '../../../lib/types/room';
import { OnlineAdapter } from '../../../lib/adapters/OnlineAdapter';
import { ImposterGameView } from '../../../components/games/imposter/ImposterGameView';
import { ForeheadGameView } from '../../../components/games/forehead/ForeheadGameView';
import { AuctionGameView } from '../../../components/games/auction/AuctionGameView';
import {
  CharadesView,
  TabooView,
  PictionaryView,
  MajorityRulesView,
  MostLikelyView,
} from '../../../components/games/party/PartyGameViews';
import {
  Copy,
  Check,
  Crown,
  Play,
  Share2,
  LogOut,
  RotateCcw,
} from 'lucide-react';

export default function RoomArenaPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = ((params?.code as string) || '').toUpperCase();

  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [adapter, setAdapter] = useState<OnlineAdapter | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`room_${roomCode}_player`);
    let playerObj: Player | null = null;
    if (stored) {
      try {
        playerObj = JSON.parse(stored);
      } catch (e) {}
    }

    if (!playerObj) {
      router.push(`/join?code=${roomCode}`);
      return;
    }

    setMyPlayer(playerObj);

    const online = new OnlineAdapter(roomCode, playerObj.name, playerObj.isHost);
    online.onRoomState((s) => setRoomState(s));
    online.onGameState((data) => setGameState(data.state));
    online.onNotification((notif) => {
      setNotification(notif.message);
      setTimeout(() => setNotification(null), 3500);
    });

    online.init();
    setAdapter(online);

    return () => {
      online.destroy();
    };
  }, [roomCode, router]);

  const copyInviteLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/join?code=${roomCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost =
    myPlayer?.id === roomState?.hostId ||
    roomState?.players.find((p) => p.id === myPlayer?.id)?.isHost === true;

  const handleAction = (action: { type: string; payload?: any }) => {
    adapter?.dispatchAction(action);
  };

  if (!roomState) {
    return (
      <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans">
        <Navbar roomCode={roomCode} />
        <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-slate-400 text-sm">
          <span>Connecting to room {roomCode}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        roomCode={roomCode}
        playStyle={roomState.playStyle}
        gameMode={roomState.selectedGame}
      />

      <main className="flex-1 max-w-lg mx-auto px-4 py-6 w-full space-y-4 pb-safe">
        {notification && (
          <div className="p-3 bg-surface-900 border border-surface-700 text-accent-green text-center text-xs font-medium scribble-card">
            {notification}
          </div>
        )}

        {/* 1. LOBBY VIEW */}
        {roomState.status === 'LOBBY' ? (
          <div className="space-y-4">
            {/* Room Code Card */}
            <Card className="p-6 text-center space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block">
                Room Code
              </span>

              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-extrabold font-mono tracking-widest text-white">
                  {roomState.code}
                </span>
                <button
                  onClick={copyInviteLink}
                  className="p-2.5 scribble-btn border border-surface-700 bg-surface-850 text-slate-300 hover:text-white hover:border-accent-yellow transition-colors"
                  title="Copy Invite Link"
                >
                  {copied ? (
                    <Check size={18} className="text-accent-yellow" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={copyInviteLink}
                  className="text-xs text-accent-yellow hover:underline flex items-center gap-1.5"
                >
                  <Share2 size={13} />
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Share Invite Link'}</span>
                </button>
              </div>
            </Card>

            {/* Host Controls: Change Game Mode */}
            {isHost && (
              <Card className="p-4 space-y-2.5">
                <span className="text-xs font-medium text-slate-400 block">
                  Select Game for this Session
                </span>
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
                      onClick={() => adapter?.changeGameMode(g.id as GameModeId)}
                      className={`p-2.5 scribble-card text-xs font-semibold text-left transition-colors min-h-[44px] ${
                        roomState.selectedGame === g.id
                          ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                          : 'border-surface-750 bg-surface-950 text-slate-300 hover:border-accent-yellow/70 hover:text-white'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Connected Participants List */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-surface-750/70 pb-3 text-xs">
                <span className="font-semibold text-slate-200 uppercase tracking-wide">
                  Players ({roomState.players.length}/{roomState.settings.maxPlayers || 10})
                </span>
                <span className="text-accent-yellow font-medium">
                  {roomState.selectedGame.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roomState.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 scribble-card bg-surface-950 border border-surface-700 text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-medium text-slate-200 truncate">{p.name}</span>
                      {p.isHost && (
                        <Crown size={13} className="text-accent-yellow flex-shrink-0" />
                      )}
                      {p.id === myPlayer?.id && (
                        <span className="text-[11px] text-accent-yellow flex-shrink-0 font-medium">
                          (You)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {p.isConnected ? 'online' : 'offline'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Start Game Action */}
              <div className="pt-3 border-t border-surface-750/70 flex items-center justify-between">
                <button
                  onClick={() => router.push('/')}
                  className="text-xs text-slate-500 hover:text-accent-red flex items-center gap-1.5 p-1 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Leave</span>
                </button>

                {isHost ? (
                  <Button
                    size="lg"
                    disabled={
                      roomState.players.length < 3 && roomState.selectedGame === 'IMPOSTER'
                    }
                    onClick={() => adapter?.startGame()}
                    className="flex items-center gap-2 text-sm sm:text-base font-semibold"
                  >
                    <Play size={16} />
                    <span>Start Game</span>
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">
                    Waiting for host to start...
                  </span>
                )}
              </div>
            </Card>
          </div>
        ) : (
          /* 2. IN-GAME ARENA VIEW */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 scribble-card bg-surface-900 border border-surface-700 text-xs">
              <span className="text-accent-green font-semibold uppercase tracking-wider">
                {roomState.selectedGame.replace(/_/g, ' ')}
              </span>

              <div className="flex items-center gap-2">
                {isHost && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adapter?.restartRound()}
                    className="text-xs px-2.5 py-1 min-h-[36px]"
                  >
                    <RotateCcw size={12} className="mr-1" />
                    <span>Restart</span>
                  </Button>
                )}

                {isHost && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => adapter?.changeGameMode('IMPOSTER')}
                    className="text-xs px-2.5 py-1 min-h-[36px]"
                  >
                    Lobby
                  </Button>
                )}
              </div>
            </div>

            {/* Game Views */}
            {roomState.selectedGame === 'IMPOSTER' && gameState && (
              <ImposterGameView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
                playStyle={roomState.playStyle}
              />
            )}

            {roomState.selectedGame === 'FOREHEAD_FRENZY' && gameState && (
              <ForeheadGameView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
                playStyle={roomState.playStyle}
              />
            )}

            {roomState.selectedGame === 'AUCTION_DRAFT' && gameState && (
              <AuctionGameView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
                playStyle={roomState.playStyle}
              />
            )}

            {roomState.selectedGame === 'DUMB_CHARADES' && gameState && (
              <CharadesView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
              />
            )}

            {roomState.selectedGame === 'TABOO' && gameState && (
              <TabooView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
              />
            )}

            {roomState.selectedGame === 'PICTIONARY' && gameState && (
              <PictionaryView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
              />
            )}

            {roomState.selectedGame === 'MAJORITY_RULES' && gameState && (
              <MajorityRulesView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
              />
            )}

            {roomState.selectedGame === 'MOST_LIKELY_TO' && gameState && (
              <MostLikelyView
                state={gameState}
                players={roomState.players}
                myPlayerId={myPlayer?.id || roomState.players[0].id}
                isHost={isHost}
                onAction={handleAction}
              />
            )}

            {/* Scoreboard */}
            <div className="pt-2">
              <Scoreboard
                players={roomState.players}
                highlightPlayerId={myPlayer?.id}
                currentRound={roomState.currentRound}
                totalRounds={roomState.totalRounds}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
