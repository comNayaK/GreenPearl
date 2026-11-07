'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/common/Navbar';
import { Button } from '../../components/ui/Button';
import { DatasetManager } from '../../lib/datasets/datasetManager';
import { TabooCard } from '../../lib/types/game';
import {
  ShieldAlert,
  Check,
  X,
  RotateCcw,
  Play,
  Pause,
  Timer,
  Trophy,
  ArrowLeft,
  Users,
  Sparkles,
  Flame,
  Volume2,
} from 'lucide-react';

type TabooPhase = 'SETUP' | 'GET_READY' | 'PLAYING' | 'TURN_SUMMARY' | 'FINAL_SCORES';

export default function TabooLocalPage() {
  const router = useRouter();

  // Setup options
  const [team1Name, setTeam1Name] = useState<string>('Team Red');
  const [team2Name, setTeam2Name] = useState<string>('Team Green');
  const [roundDuration, setRoundDuration] = useState<number>(60);
  const [totalRounds, setTotalRounds] = useState<number>(3); // Rounds per team

  // Game state
  const [phase, setPhase] = useState<TabooPhase>('SETUP');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<0 | 1>(0); // 0 = Team 1, 1 = Team 2
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);

  // Round turn state
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [deck, setDeck] = useState<TabooCard[]>([]);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [turnCorrectCount, setTurnCorrectCount] = useState<number>(0);
  const [turnTabooCount, setTurnTabooCount] = useState<number>(0);
  const [turnPassCount, setTurnPassCount] = useState<number>(0);
  const [buzzedFlash, setBuzzedFlash] = useState<boolean>(false);

  // Wake lock
  const wakeLockRef = useRef<any>(null);

  // Initialize deck from DatasetManager
  const loadDeck = () => {
    const cards = DatasetManager.getRandomTabooCards(50);
    setDeck(cards);
    setCardIndex(0);
  };

  // Keep screen awake during gameplay
  useEffect(() => {
    const acquireWakeLock = async () => {
      if (typeof window !== 'undefined' && 'wakeLock' in navigator && phase === 'PLAYING') {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (e) {}
      }
    };
    acquireWakeLock();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [phase]);

  // Round Timer countdown
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (phase === 'PLAYING' && !isPaused && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [phase, isPaused, timeLeft]);

  const handleStartGame = () => {
    loadDeck();
    setTeam1Score(0);
    setTeam2Score(0);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setPhase('GET_READY');
  };

  const startTurn = () => {
    setTimeLeft(roundDuration);
    setIsPaused(false);
    setTurnCorrectCount(0);
    setTurnTabooCount(0);
    setTurnPassCount(0);
    setPhase('PLAYING');
  };

  const handleTimeUp = () => {
    setPhase('TURN_SUMMARY');
  };

  const handleCorrect = () => {
    const pts = 1;
    if (currentTeamIndex === 0) {
      setTeam1Score((s) => s + pts);
    } else {
      setTeam2Score((s) => s + pts);
    }
    setTurnCorrectCount((c) => c + 1);
    nextCard();
  };

  const handleTabooBuzzer = () => {
    // Penalty: -1 point
    if (currentTeamIndex === 0) {
      setTeam1Score((s) => Math.max(0, s - 1));
    } else {
      setTeam2Score((s) => Math.max(0, s - 1));
    }
    setTurnTabooCount((c) => c + 1);
    setBuzzedFlash(true);
    setTimeout(() => setBuzzedFlash(false), 300);
    nextCard();
  };

  const handlePass = () => {
    setTurnPassCount((c) => c + 1);
    nextCard();
  };

  const nextCard = () => {
    if (cardIndex + 1 >= deck.length) {
      // Loop or re-shuffle
      loadDeck();
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  const handleNextTurnOrFinish = () => {
    if (currentTeamIndex === 0) {
      // Team 1 just played, now Team 2's turn in same round
      setCurrentTeamIndex(1);
      setPhase('GET_READY');
    } else {
      // Team 2 just played, advance round or finish
      if (currentRound >= totalRounds) {
        setPhase('FINAL_SCORES');
      } else {
        setCurrentRound((r) => r + 1);
        setCurrentTeamIndex(0);
        setPhase('GET_READY');
      }
    }
  };

  const currentTeamName = currentTeamIndex === 0 ? team1Name : team2Name;
  const currentCard = deck[cardIndex] || {
    word: 'Taboo',
    category: 'Party',
    forbiddenWords: ['Forbidden', 'Secret', 'Rules', 'Speak', 'Buzzer'],
  };

  return (
    <div className={`min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans transition-colors duration-200 ${buzzedFlash ? 'bg-accent-red/20' : ''}`}>
      <Navbar playStyle="PASS_AND_PLAY" gameMode="TABOO" />

      <main className="flex-1 flex flex-col justify-between max-w-md mx-auto px-4 py-6 w-full pb-safe">
        {/* ========================================================= */}
        {/* SETUP SCREEN                                              */}
        {/* ========================================================= */}
        {phase === 'SETUP' && (
          <div className="flex-1 flex flex-col justify-between space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Back to Home
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Taboo (1 Phone)
              </h1>
              <p className="text-sm text-slate-400">
                Describe the word to your team without saying the 5 forbidden taboo words!
              </p>
            </div>

            {/* Team Names */}
            <div className="space-y-4 my-auto py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-accent-red font-bold">
                  Team 1 Name
                </label>
                <input
                  type="text"
                  value={team1Name}
                  maxLength={16}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="w-full bg-surface-950 px-4 py-3 min-h-[48px] text-base text-slate-100 focus:outline-none focus:border-accent-red scribble-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-accent-green font-bold">
                  Team 2 Name
                </label>
                <input
                  type="text"
                  value={team2Name}
                  maxLength={16}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="w-full bg-surface-950 px-4 py-3 min-h-[48px] text-base text-slate-100 focus:outline-none focus:border-accent-green scribble-input"
                />
              </div>

              {/* Timer Duration */}
              <div className="pt-2">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                  Round Timer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[45, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setRoundDuration(dur)}
                      className={`py-2 px-2 scribble-btn text-xs font-bold transition-all ${
                        roundDuration === dur
                          ? 'bg-accent-yellow text-slate-950 border-accent-yellow'
                          : 'bg-surface-850 text-slate-300 border-surface-700 hover:border-slate-500'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds count */}
              <div className="pt-1">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                  Rounds per Team
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 5].map((rnd) => (
                    <button
                      key={rnd}
                      type="button"
                      onClick={() => setTotalRounds(rnd)}
                      className={`py-2 px-2 scribble-btn text-xs font-bold transition-all ${
                        totalRounds === rnd
                          ? 'bg-accent-yellow text-slate-950 border-accent-yellow'
                          : 'bg-surface-850 text-slate-300 border-surface-700 hover:border-slate-500'
                      }`}
                    >
                      {rnd} Rounds
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                variant="primary"
                className="w-full text-base font-bold shadow-lg shadow-accent-yellow/10"
                onClick={handleStartGame}
              >
                Start Game
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GET READY SCREEN (Pass to clue giver)                     */}
        {/* ========================================================= */}
        {phase === 'GET_READY' && (
          <div className="flex-1 flex flex-col justify-between space-y-6 animate-in fade-in duration-200 text-center">
            <div className="space-y-1.5 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Round {currentRound} of {totalRounds}
              </span>
              <h2 className="text-xs text-slate-500 font-mono">Next Clue Giver</h2>
            </div>

            <div className="my-auto py-8 space-y-5">
              <div
                className={`w-20 h-20 mx-auto scribble-card flex items-center justify-center shadow-lg ${
                  currentTeamIndex === 0
                    ? 'border-accent-red text-accent-red bg-accent-red/10'
                    : 'border-accent-green text-accent-green bg-accent-green/10'
                }`}
              >
                <Users size={34} />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm text-slate-400">Pass the phone to</p>
                <h3
                  className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                    currentTeamIndex === 0 ? 'text-accent-red' : 'text-accent-green'
                  }`}
                >
                  {currentTeamName}
                </h3>
              </div>

              <div className="p-4 scribble-card max-w-xs mx-auto text-left text-xs text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-200 font-mono">Rules:</p>
                <p>• Only you can look at the phone.</p>
                <p>• Describe the secret word to your teammates.</p>
                <p>• If you utter any of the 5 forbidden words, the other team taps &quot;Taboo Buzzer&quot;!</p>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs font-mono pt-2">
                <div>
                  <span className="text-slate-500 block">{team1Name}</span>
                  <span className="text-lg font-bold text-accent-red">{team1Score} pts</span>
                </div>
                <span className="text-slate-600">vs</span>
                <div>
                  <span className="text-slate-500 block">{team2Name}</span>
                  <span className="text-lg font-bold text-accent-green">{team2Score} pts</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                variant="primary"
                className="w-full text-base font-bold flex items-center justify-center gap-2"
                onClick={startTurn}
              >
                <Play size={18} />
                <span>Start {roundDuration}s Turn</span>
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVE TURN SCREEN                                        */}
        {/* ========================================================= */}
        {phase === 'PLAYING' && (
          <div className="flex-1 flex flex-col justify-between space-y-4 animate-in fade-in duration-150 select-none">
            {/* Top Bar: Team, Timer, Round Score */}
            <div className="flex items-center justify-between border-b border-surface-800 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    currentTeamIndex === 0 ? 'bg-accent-red' : 'bg-accent-green'
                  }`}
                />
                <span className="text-xs font-bold font-mono tracking-tight text-white">
                  {currentTeamName}
                </span>
              </div>

              {/* Timer */}
              <div
                className={`px-3 py-1 scribble-tag font-mono font-extrabold text-sm flex items-center gap-1.5 ${
                  timeLeft <= 10
                    ? 'border-accent-red text-accent-red bg-accent-red/10 animate-pulse'
                    : 'border-accent-yellow text-accent-yellow bg-accent-yellow/10'
                }`}
              >
                <Timer size={14} />
                <span>{timeLeft}s</span>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Score: <span className="text-white font-bold">+{turnCorrectCount}</span>
              </div>
            </div>

            {/* Taboo Card Container */}
            <div className="my-auto py-2">
              <div className="scribble-secret-card p-6 sm:p-7 space-y-5 text-center bg-surface-900 border-2 border-surface-650">
                {/* Category */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-accent-yellow px-2.5 py-0.5 scribble-tag border-accent-yellow/40 bg-accent-yellow/10 font-bold">
                    {currentCard.category}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight underline decoration-wavy decoration-accent-yellow/60 underline-offset-8 pt-1">
                    {currentCard.word}
                  </h2>
                </div>

                {/* Forbidden Words */}
                <div className="space-y-2 pt-2 border-t border-surface-800">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-accent-red font-bold">
                    <ShieldAlert size={14} />
                    <span>Forbidden Taboo Words</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1 max-w-[240px] mx-auto">
                    {currentCard.forbiddenWords.map((word, idx) => (
                      <div
                        key={idx}
                        className="py-1.5 px-3 scribble-tag border-accent-red/40 bg-accent-red/10 text-accent-red text-xs sm:text-sm font-semibold tracking-wide font-mono"
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Taboo Buzzer / Pass / Guessed */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Taboo Buzzer */}
                <button
                  type="button"
                  onClick={handleTabooBuzzer}
                  className="py-3 px-3 scribble-btn bg-accent-red/15 text-accent-red border-accent-red/70 hover:bg-accent-red/25 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all"
                >
                  <X size={16} />
                  <span>Taboo! (-1 pt)</span>
                </button>

                {/* Pass */}
                <button
                  type="button"
                  onClick={handlePass}
                  className="py-3 px-3 scribble-btn bg-surface-850 text-slate-300 border-surface-700 hover:text-white hover:border-slate-500 flex items-center justify-center gap-1.5 font-semibold text-xs sm:text-sm transition-all"
                >
                  <RotateCcw size={15} />
                  <span>Pass Card</span>
                </button>
              </div>

              {/* Guessed (Large Green Button) */}
              <button
                type="button"
                onClick={handleCorrect}
                className="w-full py-4 px-4 scribble-btn bg-accent-green text-slate-950 border-accent-green hover:bg-accent-greenLight flex items-center justify-center gap-2 font-extrabold text-base tracking-wide shadow-lg shadow-accent-green/10 transition-all active:scale-[0.98]"
              >
                <Check size={20} className="stroke-[3]" />
                <span>GUESSED! (+1 pt)</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TURN SUMMARY SCREEN                                       */}
        {/* ========================================================= */}
        {phase === 'TURN_SUMMARY' && (
          <div className="flex-1 flex flex-col justify-between space-y-6 animate-in fade-in duration-200 text-center">
            <div className="space-y-1.5 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-accent-yellow font-bold">
                Time&apos;s Up!
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Turn Summary
              </h2>
            </div>

            <div className="my-auto py-6 space-y-5">
              <div className="p-6 scribble-card space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  {currentTeamName}&apos;s Round
                </span>

                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-2.5 rounded-lg bg-accent-green/10 border border-accent-green/30">
                    <span className="text-2xl font-extrabold text-accent-green block">
                      {turnCorrectCount}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Guessed
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-accent-red/10 border border-accent-red/30">
                    <span className="text-2xl font-extrabold text-accent-red block">
                      {turnTabooCount}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Taboo (-1)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-850 border border-surface-700">
                    <span className="text-2xl font-extrabold text-slate-300 block">
                      {turnPassCount}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Passed
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-800 text-xs font-mono text-slate-300">
                  Total Points Scored: <span className="font-bold text-accent-yellow">+{turnCorrectCount - turnTabooCount} pts</span>
                </div>
              </div>

              {/* Leaderboard snapshot */}
              <div className="p-4 scribble-card-alt space-y-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Overall Standings
                </span>
                <div className="flex items-center justify-around text-sm font-mono">
                  <div className="text-center">
                    <span className="text-xs text-slate-400 block">{team1Name}</span>
                    <span className="text-xl font-bold text-accent-red">{team1Score} pts</span>
                  </div>
                  <span className="text-slate-600 font-bold">vs</span>
                  <div className="text-center">
                    <span className="text-xs text-slate-400 block">{team2Name}</span>
                    <span className="text-xl font-bold text-accent-green">{team2Score} pts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                variant="primary"
                className="w-full text-base font-bold"
                onClick={handleNextTurnOrFinish}
              >
                {currentTeamIndex === 0 ? `Pass to ${team2Name} →` : `Continue to Round ${currentRound + 1} →`}
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FINAL SCORES SCREEN                                       */}
        {/* ========================================================= */}
        {phase === 'FINAL_SCORES' && (
          <div className="flex-1 flex flex-col justify-between space-y-6 animate-in fade-in duration-200 text-center">
            <div className="space-y-1.5 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-accent-yellow font-bold">
                Game Over
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Victory Declared!
              </h2>
            </div>

            <div className="my-auto py-6 space-y-6">
              <div className="w-20 h-20 mx-auto scribble-card bg-surface-850 border-2 border-accent-yellow text-accent-yellow flex items-center justify-center shadow-lg">
                <Trophy size={36} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
                  Winner
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {team1Score > team2Score
                    ? team1Name
                    : team2Score > team1Score
                    ? team2Name
                    : "It's a Tie!"}
                </h3>
              </div>

              <div className="p-5 scribble-card flex items-center justify-around font-mono max-w-xs mx-auto">
                <div className="text-center">
                  <span className="text-xs text-slate-400 block">{team1Name}</span>
                  <span className="text-2xl font-extrabold text-accent-red">{team1Score}</span>
                </div>
                <div className="h-8 w-px bg-surface-750" />
                <div className="text-center">
                  <span className="text-xs text-slate-400 block">{team2Name}</span>
                  <span className="text-2xl font-extrabold text-accent-green">{team2Score}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                size="lg"
                variant="primary"
                className="w-full text-base font-bold"
                onClick={handleStartGame}
              >
                Play Again
              </Button>
              <Button
                size="md"
                variant="subtle"
                className="w-full text-xs font-medium"
                onClick={() => router.push('/')}
              >
                Back to All Games
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

