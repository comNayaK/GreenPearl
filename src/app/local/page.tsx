'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/common/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { DatasetManager } from '../../lib/datasets/datasetManager';
import { ImposterEngine, PassAndPlaySession } from '../../lib/engine/ImposterEngine';
import { GameModeId } from '../../lib/types/room';
import {
  Eye,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Lock,
  ArrowLeft,
  Settings,
  Sparkles,
  Shuffle,
  Fingerprint,
  Trophy,
  ShieldAlert,
} from 'lucide-react';

type SetupStep = 'COUNT' | 'NAMES' | 'CATEGORIES' | 'PLAYING';
type ImposterSubPhase = 'PASS_PHONE' | 'HOLD_TO_REVEAL' | 'DISCUSSION' | 'CONFIRM_REVEAL' | 'RESULT';

const LOCAL_STORAGE_NAMES_KEY = 'gp_player_names';
const SESSION_STORAGE_STATE_KEY = 'gp_active_imposter_round';

function LocalGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step state
  const [setupStep, setSetupStep] = useState<SetupStep>('COUNT');
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);

  // Player count & names
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);
  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Categories & difficulty
  const categoriesList = DatasetManager.getCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'bollywood_movies',
    'cricket_players',
    'food_and_dishes',
  ]);
  const [isRandomCategory, setIsRandomCategory] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // Advanced options (tucked away)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [imposterCount, setImposterCount] = useState<number>(1);
  const [imposterKnowsCategory, setImposterKnowsCategory] = useState<boolean>(false);
  const [allowLastGuess, setAllowLastGuess] = useState<boolean>(false);

  // Imposter Game State
  const [session, setSession] = useState<PassAndPlaySession | null>(null);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [currentRevealIndex, setCurrentRevealIndex] = useState<number>(0);
  const [imposterSubPhase, setImposterSubPhase] = useState<ImposterSubPhase>('PASS_PHONE');
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [hasRevealedOnce, setHasRevealedOnce] = useState<boolean>(false);
  const [showConfirmRevealModal, setShowConfirmRevealModal] = useState<boolean>(false);
  const [imposterGuessInput, setImposterGuessInput] = useState<string>('');
  const [guessChecked, setGuessChecked] = useState<boolean>(false);
  const [guessWasCorrect, setGuessWasCorrect] = useState<boolean>(false);

  // Wake lock ref
  const wakeLockRef = useRef<any>(null);

  // 1. Remember player names from localStorage on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedNames = localStorage.getItem(LOCAL_STORAGE_NAMES_KEY);
        if (savedNames) {
          const parsed = JSON.parse(savedNames);
          if (Array.isArray(parsed) && parsed.length >= 3 && parsed.length <= 10) {
            setPlayerNames(parsed);
            setPlayerCount(parsed.length);
          }
        }
      } catch (e) {}

      // Check if there is an in-progress round that survived refresh
      try {
        const savedSession = sessionStorage.getItem(SESSION_STORAGE_STATE_KEY);
        if (savedSession) {
          setHasSavedSession(true);
        }
      } catch (e) {}
    }
  }, []);

  // 2. Wake Lock API: keep screen awake during game
  useEffect(() => {
    const acquireWakeLock = async () => {
      if (typeof window !== 'undefined' && 'wakeLock' in navigator && setupStep === 'PLAYING') {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          // Wake lock may fail if battery saver is on; fail silently
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsHolding(false);
      } else if (setupStep === 'PLAYING') {
        acquireWakeLock();
      }
    };

    acquireWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [setupStep]);

  // 3. Prevent accidental navigation / refresh loss during active round
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (setupStep === 'PLAYING' && imposterSubPhase !== 'RESULT') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleBlur = () => {
      setIsHolding(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
    };
  }, [setupStep, imposterSubPhase]);

  // 4. Persist active game state to sessionStorage to survive accidental reload
  useEffect(() => {
    if (setupStep === 'PLAYING' && session) {
      try {
        sessionStorage.setItem(
          SESSION_STORAGE_STATE_KEY,
          JSON.stringify({
            session,
            currentRevealIndex,
            imposterSubPhase,
            usedWords: Array.from(usedWords),
            playerNames,
            playerCount,
            imposterKnowsCategory,
            allowLastGuess,
          })
        );
      } catch (e) {}
    }
  }, [setupStep, session, currentRevealIndex, imposterSubPhase, usedWords, playerNames, playerCount, imposterKnowsCategory, allowLastGuess]);

  // Restore game that survived refresh
  const restoreSavedSession = () => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_STATE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setSession(data.session);
        setCurrentRevealIndex(data.currentRevealIndex || 0);
        setImposterSubPhase(data.imposterSubPhase || 'PASS_PHONE');
        setUsedWords(new Set(data.usedWords || []));
        setPlayerNames(data.playerNames || playerNames);
        setPlayerCount(data.playerCount || playerCount);
        setImposterKnowsCategory(data.imposterKnowsCategory || false);
        setAllowLastGuess(data.allowLastGuess || false);
        setSetupStep('PLAYING');
        setHasSavedSession(false);
      }
    } catch (e) {
      setHasSavedSession(false);
    }
  };

  // Sync player names length with player count
  const handleCountChange = (newCount: number) => {
    if (newCount < 3 || newCount > 10) return;
    setPlayerCount(newCount);
    if (newCount < 7) {
      setImposterCount(1);
    }
    setPlayerNames((prev) => {
      const next = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          next.push(`Player ${i + 1}`);
        }
      } else {
        return next.slice(0, newCount);
      }
      return next;
    });
  };

  const handleNameChange = (index: number, value: string) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  // Name validation
  const validation = ImposterEngine.validatePlayerNames(playerNames);
  const canContinueNames = validation.isValid;

  // Save names to localStorage
  const saveNamesAndProceed = () => {
    if (!canContinueNames) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_NAMES_KEY, JSON.stringify(validation.cleanNames));
    } catch (e) {}
    setSetupStep('CATEGORIES');
  };

  // Toggle category
  const toggleCategory = (catId: string) => {
    setIsRandomCategory(false);
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const toggleRandomCategory = () => {
    if (!isRandomCategory) {
      setIsRandomCategory(true);
      setSelectedCategories(categoriesList.map((c) => c.id));
    } else {
      setIsRandomCategory(false);
      setSelectedCategories(['bollywood_movies', 'cricket_players', 'food_and_dishes']);
    }
  };

  // Launch Imposter Round
  const startImposterRound = (prevUsedWords: Set<string> = usedWords) => {
    const catsToUse = isRandomCategory ? [] : selectedCategories;
    try {
      const newSession = ImposterEngine.initPassAndPlay({
        playerNames,
        categories: catsToUse,
        usedWords: prevUsedWords,
        difficulty,
        imposterCount: playerCount >= 7 ? imposterCount : 1,
        imposterKnowsCategory,
        allowLastGuess,
      });

      const nextUsed = new Set(prevUsedWords);
      nextUsed.add(newSession.secretWord.toLowerCase().trim());
      setUsedWords(nextUsed);

      setSession(newSession);
      setCurrentRevealIndex(0);
      setImposterSubPhase('PASS_PHONE');
      setIsHolding(false);
      setHasRevealedOnce(false);
      setShowConfirmRevealModal(false);
      setImposterGuessInput('');
      setGuessChecked(false);
      setGuessWasCorrect(false);
      setSetupStep('PLAYING');
    } catch (err: any) {
      alert(err?.message || 'Error starting game');
    }
  };

  // Active player information
  const activePlayerOriginalIndex =
    session && session.revealOrder[currentRevealIndex] !== undefined
      ? session.revealOrder[currentRevealIndex]
      : 0;

  const activePlayerName =
    session && session.playerNames[activePlayerOriginalIndex]
      ? session.playerNames[activePlayerOriginalIndex]
      : '';

  const isCurrentPlayerImposter =
    session &&
    (session.imposterIndices
      ? session.imposterIndices.includes(activePlayerOriginalIndex)
      : activePlayerOriginalIndex === session.imposterIndex);

  const starterPlayerName =
    session && session.playerNames[session.starterIndex]
      ? session.playerNames[session.starterIndex]
      : '';

  const imposterPlayerNames = session
    ? session.imposterIndices && session.imposterIndices.length > 0
      ? session.imposterIndices.map((idx) => session.playerNames[idx]).join(', ')
      : session.playerNames[session.imposterIndex]
    : '';

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans">
      <Navbar playStyle="PASS_AND_PLAY" gameMode="IMPOSTER" />

      <main className="flex-1 flex flex-col justify-between max-w-md mx-auto px-4 py-6 w-full pb-safe">
        {/* ========================================================= */}
        {/* RESUME IN-PROGRESS ROUND BANNER (Survive refresh)          */}
        {/* ========================================================= */}
        {hasSavedSession && setupStep !== 'PLAYING' && (
          <div className="mb-4 p-4 scribble-card border-accent-green/50 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div>
              <p className="text-xs font-semibold text-slate-100">
                In-progress game found
              </p>
              <p className="text-[11px] text-slate-400">
                You can resume your previous round where you left off.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="primary" onClick={restoreSavedSession}>
                Resume
              </Button>
              <Button
                size="sm"
                variant="subtle"
                onClick={() => {
                  sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
                  setHasSavedSession(false);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: PLAYER COUNT STEPPER (3 to 10)                     */}
        {/* ========================================================= */}
        {setupStep === 'COUNT' && (
          <div className="flex-1 flex flex-col justify-between space-y-8 animate-in fade-in duration-200">
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Back to Home
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                How many players?
              </h2>
              <p className="text-sm text-slate-400">
                Imposter is designed for 3 to 10 players on one phone.
              </p>
            </div>

            {/* Stepper Display */}
            <div className="my-auto py-8">
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  data-testid="decrease-count-btn"
                  onClick={() => handleCountChange(playerCount - 1)}
                  disabled={playerCount <= 3}
                  className="w-14 h-14 scribble-btn bg-surface-850 border-surface-700 flex items-center justify-center text-slate-200 hover:text-white hover:border-accent-yellow disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Decrease player count"
                >
                  <Minus size={22} />
                </button>

                <div className="scribble-card w-28 py-3.5 text-center border-2 border-surface-700">
                  <span
                    data-testid="player-count-display"
                    className="text-5xl font-extrabold tracking-tight text-accent-yellow font-mono block"
                  >
                    {playerCount}
                  </span>
                  <span className="block text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
                    Players
                  </span>
                </div>

                <button
                  type="button"
                  data-testid="increase-count-btn"
                  onClick={() => handleCountChange(playerCount + 1)}
                  disabled={playerCount >= 10}
                  className="w-14 h-14 scribble-btn bg-surface-850 border-surface-700 flex items-center justify-center text-slate-200 hover:text-white hover:border-accent-yellow disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Increase player count"
                >
                  <Plus size={22} />
                </button>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4">
              <Button
                data-testid="continue-count-btn"
                size="lg"
                className="w-full text-base font-semibold"
                onClick={() => setSetupStep('NAMES')}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: PLAYER NAMES (Exact count, Enter advances)         */}
        {/* ========================================================= */}
        {setupStep === 'NAMES' && (
          <div className="flex-1 flex flex-col justify-between space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setSetupStep('COUNT')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Change Count
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Enter player names
              </h2>
              <p className="text-sm text-slate-400">
                Names are remembered automatically for next time. Press enter to jump to next.
              </p>
            </div>

            {/* Inputs list */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {playerNames.map((name, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-accent-green select-none opacity-80">
                    #{idx + 1}
                  </div>
                  <input
                    ref={(el) => {
                      nameInputRefs.current[idx] = el;
                    }}
                    type="text"
                    data-testid={`player-name-input-${idx}`}
                    value={name}
                    placeholder={`Player ${idx + 1}`}
                    maxLength={20}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (idx + 1 < playerCount) {
                          nameInputRefs.current[idx + 1]?.focus();
                          nameInputRefs.current[idx + 1]?.select();
                        } else if (canContinueNames) {
                          saveNamesAndProceed();
                        }
                      }
                    }}
                    className="w-full bg-surface-950 pl-11 pr-4 py-3 min-h-[52px] text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/40 transition-all scribble-input"
                  />
                </div>
              ))}

              {!validation.isValid && (
                <p className="text-xs text-accent-red mt-2 px-1 font-mono">
                  {validation.error}
                </p>
              )}
            </div>

            {/* Action */}
            <div className="pt-4">
              <Button
                data-testid="continue-names-btn"
                size="lg"
                className="w-full text-base font-semibold"
                disabled={!canContinueNames}
                onClick={saveNamesAndProceed}
              >
                Choose Categories
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: CATEGORIES & ADVANCED OPTIONS                     */}
        {/* ========================================================= */}
        {setupStep === 'CATEGORIES' && (
          <div className="flex-1 flex flex-col justify-between space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setSetupStep('NAMES')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Back to Names
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Select categories
              </h2>
              <p className="text-sm text-slate-400">
                Choose word pools or randomize across all 2,000+ words.
              </p>
            </div>

            {/* Chips Container */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {/* Random / All Toggle Chip */}
              <div>
                <button
                  type="button"
                  onClick={toggleRandomCategory}
                  className={`w-full flex items-center justify-between p-3.5 text-left transition-colors min-h-[52px] scribble-card ${
                    isRandomCategory
                      ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                      : 'border-surface-750 bg-surface-900 text-slate-300 hover:border-accent-yellow/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shuffle size={16} className={isRandomCategory ? 'text-accent-yellow' : 'text-slate-400'} />
                    <span className="text-sm font-semibold">Random (All Categories)</span>
                  </div>
                  {isRandomCategory && (
                    <Check size={18} className="text-accent-yellow" />
                  )}
                </button>
              </div>

              {/* Category Chips Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {categoriesList.map((cat, idx) => {
                  const isSelected = isRandomCategory || selectedCategories.includes(cat.id);
                  const isAlt = idx % 2 === 1;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center justify-between p-3 text-left transition-colors min-h-[52px] text-xs sm:text-sm font-medium ${
                        isAlt ? 'scribble-card-alt' : 'scribble-card'
                      } ${
                        isSelected
                          ? 'border-accent-yellow bg-accent-yellow/15 text-white font-semibold'
                          : 'border-surface-750 bg-surface-900 text-slate-300 hover:border-accent-yellow/70 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{cat.label}</span>
                      {isSelected && (
                        <Check size={15} className="text-accent-yellow shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tucked away Advanced Game Settings */}
              <div className="pt-2 border-t border-surface-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 font-medium py-1"
                >
                  <Settings size={13} />
                  <span>Advanced Game Options</span>
                  <span className="text-[10px] opacity-60">
                    {showAdvanced ? '▲' : '▼'}
                  </span>
                </button>

                {showAdvanced && (
                  <div className="space-y-3 pt-3 p-4 scribble-card text-xs">
                    {/* Imposter count toggle when 7+ players */}
                    {playerCount >= 7 && (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-200 block">
                            Number of Imposters
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Available for 7–10 players
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {[1, 2].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => setImposterCount(cnt)}
                              className={`px-3 py-1.5 scribble-btn text-xs font-semibold ${
                                imposterCount === cnt
                                  ? 'bg-accent-yellow text-slate-950 border-accent-yellow'
                                  : 'bg-surface-850 text-slate-300 border-surface-700 hover:border-accent-yellow'
                              }`}
                            >
                              {cnt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category hint toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="font-semibold text-slate-200 block">
                          Category Hint for Imposter
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Shows category name on imposter card
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImposterKnowsCategory(!imposterKnowsCategory)}
                        className={`w-12 h-6 scribble-btn transition-colors relative ${
                          imposterKnowsCategory ? 'bg-accent-yellow text-slate-950 border-accent-yellow' : 'bg-surface-800 text-surface-600 border-surface-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            imposterKnowsCategory ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Optional imposter last guess */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="font-semibold text-slate-200 block">
                          Imposter Final Guess
                        </span>
                        <span className="text-[11px] text-slate-400">
                          One shot to steal the win if caught
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowLastGuess(!allowLastGuess)}
                        className={`w-12 h-6 scribble-btn transition-colors relative ${
                          allowLastGuess ? 'bg-accent-yellow text-slate-950 border-accent-yellow' : 'bg-surface-800 text-surface-600 border-surface-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            allowLastGuess ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Difficulty selector */}
                    <div className="pt-2 border-t border-surface-800/80">
                      <span className="font-semibold text-slate-300 block mb-1.5 font-mono">
                        Word Difficulty
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setDifficulty(diff)}
                            className={`py-1.5 px-1 text-center scribble-tag text-[11px] font-semibold uppercase transition-colors ${
                              difficulty === diff
                                ? 'bg-accent-yellow/15 border-accent-yellow text-accent-yellow'
                                : 'bg-surface-850 border-surface-700 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="pt-4">
              <Button
                data-testid="start-game-btn"
                size="lg"
                className="w-full text-base font-semibold"
                disabled={selectedCategories.length === 0 && !isRandomCategory}
                onClick={() => startImposterRound()}
              >
                Start Game
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAMEPLAY 1: PASS PHONE SCREEN ("Pass to <Name>")          */}
        {/* ========================================================= */}
        {setupStep === 'PLAYING' && imposterSubPhase === 'PASS_PHONE' && (
          <div className="flex-1 flex flex-col justify-between space-y-8 animate-in fade-in duration-200 text-center">
            <div className="space-y-1.5 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Player {currentRevealIndex + 1} of {session?.playerNames.length}
              </span>
              <h2 className="text-xs text-slate-400">Secret Card Reveal</h2>
            </div>

            {/* Center Pass Message */}
            <div className="my-auto py-8 space-y-4">
              <div className="w-20 h-20 mx-auto scribble-card bg-surface-850 border-2 border-surface-700 flex items-center justify-center text-accent-yellow shadow-md">
                <Lock size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400">Pass the phone to</p>
                <h3
                  data-testid="active-player-name-pass"
                  className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
                >
                  {activePlayerName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Make sure nobody else is looking at the screen.
              </p>
            </div>

            {/* Action */}
            <div className="pt-4">
              <Button
                data-testid="im-player-btn"
                size="lg"
                variant="primary"
                className="w-full text-base font-semibold"
                onClick={() => {
                  setImposterSubPhase('HOLD_TO_REVEAL');
                  setIsHolding(false);
                  setHasRevealedOnce(false);
                }}
              >
                I&apos;m {activePlayerName}
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAMEPLAY 2: FOLDED CARD (Press and hold 3D unfold)        */}
        {/* ========================================================= */}
        {setupStep === 'PLAYING' && imposterSubPhase === 'HOLD_TO_REVEAL' && (
          <div className="flex-1 flex flex-col justify-between space-y-6 animate-in fade-in duration-200 text-center select-none touch-hold-card">
            <div className="space-y-1 pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                {activePlayerName}
              </span>
              <p className="text-xs text-slate-500">
                Press and hold anywhere on the card below
              </p>
            </div>

            {/* Folded Card Area */}
            <div className="my-auto py-6 flex items-center justify-center w-full">
              <div
                data-testid="hold-reveal-card"
                onPointerDown={() => {
                  setIsHolding(true);
                  setHasRevealedOnce(true);
                }}
                onPointerUp={() => setIsHolding(false)}
                onPointerCancel={() => setIsHolding(false)}
                onPointerLeave={() => setIsHolding(false)}
                onTouchStart={() => {
                  setIsHolding(true);
                  setHasRevealedOnce(true);
                }}
                onTouchEnd={() => setIsHolding(false)}
                onTouchCancel={() => setIsHolding(false)}
                onContextMenu={(e) => e.preventDefault()}
                className={`touch-hold-card scribble-secret-card w-full max-w-xs min-h-[380px] p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-200 ${
                  isHolding
                    ? isCurrentPlayerImposter
                      ? 'imposter-unfolded'
                      : 'unfolded border-accent-green'
                    : 'hover:border-accent-yellow/80'
                }`}
              >
                {/* STRICT ZERO-LEAK DOM: Secret is strictly removed from DOM when not actively holding */}
                {isHolding ? (
                  <div className="space-y-4 animate-in fade-in duration-150 text-center">
                    {isCurrentPlayerImposter ? (
                      <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-accent-red/15 text-accent-red flex items-center justify-center border-2 border-accent-red/40 shadow-sm">
                          <Eye size={32} />
                        </div>
                        <h3
                          data-testid="role-imposter-text"
                          className="text-2xl sm:text-3xl font-extrabold text-accent-red tracking-tight underline decoration-wavy decoration-accent-red/60 underline-offset-8"
                        >
                          You are the Imposter
                        </h3>
                        {session?.imposterKnowsCategory && (
                          <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-slate-300 px-3 py-1 scribble-tag border-surface-700 bg-surface-850">
                            Category: {session?.category?.replace(/_/g, ' ')}
                          </span>
                        )}
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto pt-1 font-mono">
                          You do not know the secret word. Blend in and listen closely to clues.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <span
                          data-testid="secret-category-text"
                          className="inline-block text-[11px] font-mono uppercase tracking-widest text-accent-green px-3 py-1 scribble-tag border-accent-green/50 bg-accent-green/10"
                        >
                          {session?.category?.replace(/_/g, ' ')}
                        </span>
                        <h3
                          data-testid="secret-word-text"
                          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight underline decoration-wavy decoration-accent-green/60 underline-offset-8"
                        >
                          {session?.secretWord}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto pt-2 font-mono">
                          Give a subtle hint without revealing this word to the imposter.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-surface-850 border-2 border-surface-700 flex items-center justify-center text-accent-yellow shadow-md">
                      <Lock size={28} />
                    </div>
                    <div className="space-y-1.5">
                      <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold px-2.5 py-0.5 scribble-tag border-surface-700 bg-surface-850">
                        {hasRevealedOnce ? 'Card Hidden' : 'Secret Card'}
                      </span>
                      <h4
                        data-testid="card-placeholder-text"
                        className="text-lg sm:text-xl font-bold text-white tracking-tight"
                      >
                        {hasRevealedOnce
                          ? 'Hidden. Hold again to re-check.'
                          : 'Hold to reveal secret'}
                      </h4>
                    </div>
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-yellow hover:bg-accent-yellowLight text-slate-950 text-xs font-bold tracking-wide scribble-btn shadow-md transition-colors">
                        <Fingerprint size={16} className="text-slate-950" />
                        <span>HOLD TO REVEAL</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Keep your finger pressed on this card to view
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Hide & Pass on button */}
            <div className="pt-4 space-y-2">
              <Button
                data-testid="hide-pass-btn"
                size="lg"
                variant={hasRevealedOnce ? 'primary' : 'secondary'}
                disabled={!hasRevealedOnce}
                className="w-full text-base font-semibold"
                onClick={() => {
                  setIsHolding(false);
                  if (session && currentRevealIndex + 1 < session.revealOrder.length) {
                    setCurrentRevealIndex(currentRevealIndex + 1);
                    setImposterSubPhase('PASS_PHONE');
                    setHasRevealedOnce(false);
                  } else {
                    setImposterSubPhase('DISCUSSION');
                    setHasRevealedOnce(false);
                  }
                }}
              >
                Hide & pass on
              </Button>
              {!hasRevealedOnce && (
                <p className="text-[11px] text-slate-500">
                  Hold card at least once to enable
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAMEPLAY 3: DISCUSSION SCREEN (NO timer, starter clue)     */}
        {/* ========================================================= */}
        {setupStep === 'PLAYING' && imposterSubPhase === 'DISCUSSION' && (
          <div className="flex-1 flex flex-col justify-between space-y-8 animate-in fade-in duration-200 text-center">
            <div className="space-y-1.5 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-accent-green font-semibold">
                All Cards Revealed
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Discussion & Clues
              </h2>
            </div>

            {/* Clue Starter & In-person Instructions */}
            <div className="my-auto py-6 space-y-5">
              <div className="p-5 scribble-card space-y-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                  First Clue
                </span>
                <div
                  data-testid="starter-clue-giver"
                  className="text-2xl sm:text-3xl font-bold text-accent-yellow underline decoration-wavy decoration-accent-yellow/50 underline-offset-4"
                >
                  {starterPlayerName} starts!
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Go around the circle clockwise. Each player gives one single-word or short clue related to the secret.
                </p>
              </div>

              <div className="p-4 scribble-card-alt text-left space-y-2 text-xs text-slate-400">
                <div className="font-semibold text-slate-200 font-mono">How to play</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Innocents give subtle clues to prove they know the word.</li>
                  <li>The imposter must bluff and pretend to know it.</li>
                  <li>After clues, interrogate suspects and vote out loud as a group.</li>
                </ul>
              </div>
            </div>

            {/* Action: Reveal Imposter (triggers confirmation sheet) */}
            <div className="pt-4">
              <Button
                data-testid="reveal-imposter-btn"
                size="lg"
                variant="primary"
                className="w-full text-base font-semibold"
                onClick={() => setShowConfirmRevealModal(true)}
              >
                Reveal imposter
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAMEPLAY 4: RESULT SCREEN (Imposter + Secret + Actions)   */}
        {/* ========================================================= */}
        {setupStep === 'PLAYING' && imposterSubPhase === 'RESULT' && (
          <div className="flex-1 flex flex-col justify-between space-y-8 animate-in fade-in duration-200 text-center">
            <div className="space-y-1.5 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-accent-red font-semibold">
                Round Finished
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                The Truth Revealed
              </h2>
            </div>

            {/* Revealed Outcome */}
            <div className="my-auto py-6 space-y-4">
              <div className="p-6 scribble-secret-card space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                    The Imposter was
                  </span>
                  <div
                    data-testid="revealed-imposter-name"
                    className="text-3xl font-extrabold text-accent-red underline decoration-wavy decoration-accent-red/60 underline-offset-4"
                  >
                    {imposterPlayerNames}
                  </div>
                </div>

                <div className="h-px bg-surface-750 w-full" />

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                    Secret Word ({session?.category?.replace(/_/g, ' ')})
                  </span>
                  <div
                    data-testid="revealed-secret-word"
                    className="text-2xl font-bold text-white underline decoration-wavy decoration-accent-green/60 underline-offset-4"
                  >
                    {session?.secretWord}
                  </div>
                </div>

                {/* Optional Imposter Final Guess Attempt */}
                {session?.allowLastGuess && !guessChecked && (
                  <div className="pt-3 border-t border-surface-800/80 space-y-2">
                    <span className="text-xs font-semibold text-accent-yellow block font-mono">
                      Imposter&apos;s Final Guess
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imposterGuessInput}
                        onChange={(e) => setImposterGuessInput(e.target.value)}
                        placeholder="Guess the secret word..."
                        className="flex-1 bg-surface-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-accent-yellow scribble-input"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!imposterGuessInput.trim()}
                        onClick={() => {
                          const cleanGuess = imposterGuessInput.trim().toLowerCase();
                          const cleanSecret = session.secretWord.trim().toLowerCase();
                          const isCorrect =
                            cleanGuess === cleanSecret ||
                            (cleanSecret.includes(cleanGuess) && cleanGuess.length >= 4);
                          setGuessWasCorrect(isCorrect);
                          setGuessChecked(true);
                        }}
                      >
                        Check
                      </Button>
                    </div>
                  </div>
                )}

                {guessChecked && (
                  <div className="p-3 scribble-card bg-surface-950 text-xs font-medium">
                    {guessWasCorrect ? (
                      <span className="text-accent-green inline-flex items-center gap-1.5 justify-center">
                        <Trophy size={15} />
                        <span>Correct guess! The Imposter steals the victory!</span>
                      </span>
                    ) : (
                      <span className="text-accent-red inline-flex items-center gap-1.5 justify-center">
                        <ShieldAlert size={15} />
                        <span>Incorrect guess! The Innocents hold their win!</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3 Action Buttons */}
            <div className="pt-4 space-y-2.5">
              <Button
                data-testid="play-again-btn"
                size="lg"
                className="w-full text-base font-semibold"
                onClick={() => startImposterRound(usedWords)}
              >
                <RotateCcw size={18} className="mr-2" />
                Play again (new word)
              </Button>

              <Button
                size="md"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
                  setSetupStep('NAMES');
                }}
              >
                Change players or category
              </Button>

              <Button
                size="md"
                variant="subtle"
                className="w-full"
                onClick={() => {
                  sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
                  router.push('/');
                }}
              >
                Home
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Sheet for Reveal */}
        <Modal
          isOpen={showConfirmRevealModal}
          onClose={() => setShowConfirmRevealModal(false)}
          title="Voting done?"
          maxWidth="sm"
        >
          <div className="space-y-4 pt-1 text-center">
            <p className="text-sm text-slate-300">
              Only reveal once the group has agreed and cast their final votes out loud.
            </p>

            <div className="space-y-2 pt-2">
              <Button
                data-testid="confirm-reveal-yes-btn"
                size="lg"
                className="w-full text-base font-semibold"
                onClick={() => {
                  setShowConfirmRevealModal(false);
                  setImposterSubPhase('RESULT');
                }}
              >
                Yes, reveal
              </Button>

              <Button
                size="md"
                variant="secondary"
                className="w-full"
                onClick={() => setShowConfirmRevealModal(false)}
              >
                Not yet
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}

export default function LocalGamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-950 text-slate-400 flex items-center justify-center font-mono text-xs">
          Loading Pass & Play...
        </div>
      }
    >
      <LocalGameContent />
    </Suspense>
  );
}
