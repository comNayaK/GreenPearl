import { ForeheadGameState, ForeheadWord } from '../types/game';
import { ForeheadSettings } from '../types/room';
import { DatasetManager } from '../datasets/datasetManager';

export class ForeheadEngine {
  /**
   * Initializes a new Forehead Frenzy Round
   */
  public static initRound(activeGuesserId: string, settings: Partial<ForeheadSettings>): ForeheadGameState {
    const decks = settings.selectedDecks && settings.selectedDecks.length > 0
      ? settings.selectedDecks
      : ['bollywood_movies', 'hindi_songs', 'food_and_dishes', 'cricket_players'];

    const duration = settings.durationSeconds || 60;
    const passLimit = settings.passLimit ?? 3;

    // Sample 50 words to ensure we never run out in a round
    const items = DatasetManager.getRandomItems(decks, 50, 'all');
    const words: ForeheadWord[] = items.map((item, idx) => ({
      id: `fh_${idx}_${item.id}`,
      text: item.name,
      category: item.category || 'General',
      difficulty: item.difficulty || 'medium',
      points: item.difficulty === 'hard' ? 2 : 1,
    }));

    return {
      phase: 'PRE_ROUND',
      activeGuesserId,
      currentWordIndex: 0,
      words,
      currentWord: words[0] || null,
      guessedWords: [],
      timeRemaining: duration,
      totalTime: duration,
      passesLeft: passLimit,
      currentStreak: 0,
      roundScore: 0,
    };
  }

  /**
   * Starts the round timer and action
   */
  public static startRound(state: ForeheadGameState): ForeheadGameState {
    return {
      ...state,
      phase: 'PLAYING',
    };
  }

  /**
   * Action: Word Guessed Correctly
   */
  public static markCorrect(state: ForeheadGameState, consecutiveBonus: boolean = true): ForeheadGameState {
    if (state.phase !== 'PLAYING' || !state.currentWord) return state;

    const streak = state.currentStreak + 1;
    const bonus = consecutiveBonus && streak >= 3 ? 1 : 0;
    const earnedPoints = state.currentWord.points + bonus;

    const nextIndex = state.currentWordIndex + 1;
    const nextWord = state.words[nextIndex] || null;

    return {
      ...state,
      currentWordIndex: nextIndex,
      currentWord: nextWord,
      guessedWords: [
        ...state.guessedWords,
        { word: state.currentWord, correct: true, points: earnedPoints },
      ],
      currentStreak: streak,
      roundScore: state.roundScore + earnedPoints,
    };
  }

  /**
   * Action: Skip Word
   */
  public static markSkip(state: ForeheadGameState): ForeheadGameState {
    if (state.phase !== 'PLAYING' || !state.currentWord) return state;

    // Check pass limit if > 0
    if (state.passesLeft <= 0) {
      return state; // Cannot pass
    }

    const nextIndex = state.currentWordIndex + 1;
    const nextWord = state.words[nextIndex] || null;

    return {
      ...state,
      currentWordIndex: nextIndex,
      currentWord: nextWord,
      passesLeft: state.passesLeft - 1,
      currentStreak: 0, // Reset streak on skip
      guessedWords: [
        ...state.guessedWords,
        { word: state.currentWord, correct: false, points: 0 },
      ],
    };
  }

  /**
   * Decrements timer tick (1 second)
   */
  public static tick(state: ForeheadGameState): ForeheadGameState {
    if (state.phase !== 'PLAYING') return state;

    const nextTime = state.timeRemaining - 1;
    if (nextTime <= 0) {
      return {
        ...state,
        timeRemaining: 0,
        phase: 'ROUND_SUMMARY',
      };
    }

    return {
      ...state,
      timeRemaining: nextTime,
    };
  }

  /**
   * Force end round
   */
  public static endRound(state: ForeheadGameState): ForeheadGameState {
    return {
      ...state,
      phase: 'ROUND_SUMMARY',
    };
  }
}

