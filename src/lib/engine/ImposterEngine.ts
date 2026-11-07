import { ImposterGameState, ImposterPhase } from '../types/game';
import { ImposterSettings } from '../types/room';
import { DatasetManager } from '../datasets/datasetManager';
import { TurnManager } from './TurnManager';

export interface PassAndPlaySession {
  playerNames: string[];
  secretWord: string;
  category: string;
  imposterIndex: number; // primary imposter index
  imposterIndices: number[]; // array of imposter indices (supports 1 or 2)
  starterIndex: number;
  revealOrder: number[];
  imposterKnowsCategory?: boolean;
  allowLastGuess?: boolean;
}

export class ImposterEngine {
  /**
   * Validates player names for Pass & Play and local sessions
   * - Must have 3 to 10 players
   * - All names non-empty
   * - All names unique (case-insensitive)
   */
  public static validatePlayerNames(names: string[]): {
    isValid: boolean;
    error?: string;
    cleanNames: string[];
  } {
    const cleanNames = names.map(n => n.trim()).filter(n => n.length > 0);

    if (cleanNames.length < 3) {
      return {
        isValid: false,
        error: 'Imposter requires at least 3 players (max 10).',
        cleanNames,
      };
    }

    if (cleanNames.length > 10) {
      return {
        isValid: false,
        error: 'Imposter supports a maximum of 10 players.',
        cleanNames,
      };
    }

    if (cleanNames.length !== names.length) {
      return {
        isValid: false,
        error: 'All player names must be filled.',
        cleanNames,
      };
    }

    const seen = new Set<string>();
    for (const name of cleanNames) {
      const lower = name.toLowerCase();
      if (seen.has(lower)) {
        return {
          isValid: false,
          error: `Player name "${name}" is duplicated. Names must be unique.`,
          cleanNames,
        };
      }
      seen.add(lower);
    }

    return {
      isValid: true,
      cleanNames,
    };
  }

  /**
   * Initializes a Pass & Play Imposter session
   * - Selects non-repeating secret word from chosen categories
   * - Uniformly chooses imposter and starter
   * - Shuffles reveal order
   */
  public static initPassAndPlay(params: {
    playerNames: string[];
    categories: string[];
    usedWords?: Set<string>;
    difficulty?: 'easy' | 'medium' | 'hard' | 'all';
    imposterCount?: number;
    imposterKnowsCategory?: boolean;
    allowLastGuess?: boolean;
  }): PassAndPlaySession {
    const validation = this.validatePlayerNames(params.playerNames);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const cleanNames = validation.cleanNames;
    const categories = params.categories.length > 0
      ? params.categories
      : ['bollywood_movies', 'cricket_players', 'food_and_dishes'];

    const wordItem = DatasetManager.getRandomWord(categories, params.difficulty || 'all', params.usedWords);

    // Pick 1 or 2 imposters (2 allowed only when >= 7 players)
    const countToPick = cleanNames.length >= 7 ? Math.min(params.imposterCount || 1, 2) : 1;
    const imposterIndices: number[] = [];
    while (imposterIndices.length < countToPick) {
      const idx = Math.floor(Math.random() * cleanNames.length);
      if (!imposterIndices.includes(idx)) {
        imposterIndices.push(idx);
      }
    }
    const imposterIndex = imposterIndices[0];

    // Uniform random starter player index
    const starterIndex = Math.floor(Math.random() * cleanNames.length);

    // Shuffled reveal order
    const indices = cleanNames.map((_, i) => i);
    const revealOrder = [...indices].sort(() => 0.5 - Math.random());

    return {
      playerNames: cleanNames,
      secretWord: wordItem.name,
      category: wordItem.category || 'General',
      imposterIndex,
      imposterIndices,
      starterIndex,
      revealOrder,
      imposterKnowsCategory: params.imposterKnowsCategory || false,
      allowLastGuess: params.allowLastGuess || false,
    };
  }

  /**
   * Initializes a new Imposter Game (Online / Socket.IO)
   */
  public static initGame(
    playerIds: string[],
    settings: Partial<ImposterSettings>,
    usedWords?: Set<string>
  ): ImposterGameState {
    if (playerIds.length < 3) {
      throw new Error('Imposter requires at least 3 players.');
    }

    const categories = settings.selectedCategories && settings.selectedCategories.length > 0
      ? settings.selectedCategories
      : ['bollywood_movies', 'cricket_players', 'food_and_dishes'];

    const difficulty = settings.difficulty || 'all';
    const wordItem = DatasetManager.getRandomWord(categories, difficulty, usedWords);

    // Pick 1 random imposter
    const imposterIndex = Math.floor(Math.random() * playerIds.length);
    const imposterId = playerIds[imposterIndex];

    // Shuffled speaking order
    const speakingOrder = TurnManager.shufflePlayers(playerIds);

    return {
      phase: 'ROLE_REVEAL',
      category: wordItem.category || 'General',
      secretWord: wordItem.name,
      imposterId,
      speakingOrder,
      activeSpeakerIndex: 0,
      clueRound: 1,
      maxClueRounds: settings.clueRounds || 1,
      votes: {},
      isTie: false,
      timer: settings.discussionTimeSeconds || 60,
    };
  }

  /**
   * Progresses clue giving turns
   */
  public static nextSpeaker(state: ImposterGameState): ImposterGameState {
    if (state.phase !== 'CLUE_GIVING') return state;

    const nextIndex = state.activeSpeakerIndex + 1;
    if (nextIndex >= state.speakingOrder.length) {
      // Finished a round of clues
      if (state.clueRound < state.maxClueRounds) {
        return {
          ...state,
          activeSpeakerIndex: 0,
          clueRound: state.clueRound + 1,
        };
      } else {
        // Clue rounds finished -> transition to discussion
        return {
          ...state,
          phase: 'DISCUSSION',
        };
      }
    }

    return {
      ...state,
      activeSpeakerIndex: nextIndex,
    };
  }

  /**
   * Records a vote from a player
   */
  public static submitVote(
    state: ImposterGameState,
    voterId: string,
    votedPlayerId: string,
    allPlayerIds: string[],
    imposterCanGuess: boolean = true
  ): ImposterGameState {
    if (state.phase !== 'VOTING') return state;

    const newVotes = { ...state.votes, [voterId]: votedPlayerId };

    // Check if everyone has voted
    const allVoted = allPlayerIds.every(id => newVotes[id] !== undefined);
    if (!allVoted) {
      return { ...state, votes: newVotes };
    }

    // Resolve votes
    const tally: Record<string, number> = {};
    for (const targetId of Object.values(newVotes)) {
      tally[targetId] = (tally[targetId] || 0) + 1;
    }

    let maxVotes = 0;
    let topCandidates: string[] = [];

    for (const [targetId, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        topCandidates = [targetId];
      } else if (count === maxVotes) {
        topCandidates.push(targetId);
      }
    }

    if (topCandidates.length > 1) {
      // Tied vote
      return {
        ...state,
        votes: newVotes,
        isTie: true,
        phase: 'VOTE_REVEAL',
      };
    }

    const eliminatedId = topCandidates[0];
    const imposterCaught = eliminatedId === state.imposterId;

    if (imposterCaught && imposterCanGuess) {
      return {
        ...state,
        votes: newVotes,
        eliminatedPlayerId: eliminatedId,
        isTie: false,
        phase: 'IMPOSTER_GUESS',
      };
    }

    return {
      ...state,
      votes: newVotes,
      eliminatedPlayerId: eliminatedId,
      isTie: false,
      innocentsWon: imposterCaught,
      phase: 'ROUND_OVER',
    };
  }

  /**
   * Handles the imposter's final guess for the secret word
   */
  public static submitImposterGuess(state: ImposterGameState, guess: string): ImposterGameState {
    if (state.phase !== 'IMPOSTER_GUESS') return state;

    const cleanGuess = guess.trim().toLowerCase();
    const cleanSecret = state.secretWord.trim().toLowerCase();

    // Check exact match or close match
    const isCorrect = cleanGuess === cleanSecret || cleanSecret.includes(cleanGuess) && cleanGuess.length >= 4;

    return {
      ...state,
      imposterGuessedWord: guess,
      imposterGuessCorrect: isCorrect,
      innocentsWon: !isCorrect, // If imposter guesses word correctly, imposter wins!
      phase: 'ROUND_OVER',
    };
  }

  /**
   * CRITICAL SECURITY METHOD:
   * Masks secret information based on player identity.
   * Imposter will NEVER receive the secret word over Socket or in client state.
   */
  public static getMaskedState(state: ImposterGameState, viewerPlayerId: string): ImposterGameState & { myRole: 'IMPOSTER' | 'INNOCENT' } {
    const isImposter = viewerPlayerId === state.imposterId;

    if (isImposter) {
      return {
        ...state,
        secretWord: state.phase === 'ROUND_OVER' ? state.secretWord : '??? (YOU ARE THE IMPOSTER)',
        myRole: 'IMPOSTER',
      };
    }

    return {
      ...state,
      myRole: 'INNOCENT',
    };
  }
}

