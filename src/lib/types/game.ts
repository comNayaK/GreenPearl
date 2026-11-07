import { GameModeId, Player } from './room';

// Turn management
export interface TurnState {
  order: string[]; // Player IDs in turn order
  currentIndex: number;
  activePlayerId: string;
  nextPlayerId: string;
  roundNumber: number;
  timeRemainingSeconds: number;
  isPaused: boolean;
}

// -------------------------------------------------------------
// 1. IMPOSTER
// -------------------------------------------------------------
export type ImposterPhase =
  | 'ROLE_REVEAL'
  | 'CLUE_GIVING'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_REVEAL'
  | 'IMPOSTER_GUESS'
  | 'ROUND_OVER';

export interface ImposterGameState {
  phase: ImposterPhase;
  category: string;
  secretWord: string; // ONLY visible to server and non-imposters
  imposterId: string;
  speakingOrder: string[];
  activeSpeakerIndex: number;
  clueRound: number;
  maxClueRounds: number;
  votes: Record<string, string>; // voterId -> votedPlayerId
  eliminatedPlayerId?: string;
  isTie: boolean;
  imposterGuessedWord?: string;
  imposterGuessCorrect?: boolean;
  innocentsWon?: boolean;
  timer: number;
}

// -------------------------------------------------------------
// 2. FOREHEAD FRENZY
// -------------------------------------------------------------
export type ForeheadPhase = 'PRE_ROUND' | 'PLAYING' | 'ROUND_SUMMARY';

export interface ForeheadWord {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface ForeheadGameState {
  phase: ForeheadPhase;
  activeGuesserId: string;
  currentWordIndex: number;
  words: ForeheadWord[];
  currentWord: ForeheadWord | null;
  guessedWords: Array<{ word: ForeheadWord; correct: boolean; points: number }>;
  timeRemaining: number;
  totalTime: number;
  passesLeft: number;
  currentStreak: number;
  roundScore: number;
}

// -------------------------------------------------------------
// 3. AUCTION DRAFT
// -------------------------------------------------------------
export type AuctionPhase =
  | 'READY'
  | 'BIDDING'
  | 'ASSET_WON'
  | 'UNSOLD'
  | 'TEAM_EVALUATION'
  | 'AUCTION_COMPLETE';

export interface FootballAsset {
  id: string;
  name: string;
  category: 'football';
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  overallRating: number;
  club: string;
  league: string;
  nationality: string;
  basePrice: number;
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
}

export interface ClashRoyaleAsset {
  id: string;
  name: string;
  category: 'clash_royale';
  elixirCost: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Champion';
  cardType: 'Troop' | 'Spell' | 'Building';
  target: 'Ground' | 'Air' | 'Buildings' | 'All';
  basePrice: number;
  attributes: {
    synergyScore: number;
    winCondition: boolean;
    defenseRating: number;
    counterVersatility: number;
  };
}

export type AuctionAsset = FootballAsset | ClashRoyaleAsset;

export interface TeamEvaluationResult {
  playerId: string;
  playerName: string;
  totalScore: number; // 0 - 100
  ratingTier: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    qualityScore: number;
    positionBalance: number;
    synergyScore: number;
    tacticalBalance: number;
    valueForMoney: number;
  };
  pros: string[];
  cons: string[];
  summary: string;
}

export interface AuctionGameState {
  phase: AuctionPhase;
  category: 'football' | 'clash_royale';
  targetTeamSize: number;
  startingBudget: number;
  availablePool: AuctionAsset[];
  currentAssetIndex: number;
  currentAsset: AuctionAsset | null;
  currentBid: number;
  currentBidderId: string | null;
  bidTimer: number;
  bidHistory: Array<{ bidderId: string; amount: number; timestamp: number }>;
  rosters: Record<string, { budget: number; assets: AuctionAsset[] }>;
  unsoldAssets: AuctionAsset[];
  evaluations?: Record<string, TeamEvaluationResult>;
}

// -------------------------------------------------------------
// 4. ADDITIONAL PARTY MODES
// -------------------------------------------------------------

// Dumb Charades
export interface CharadesGameState {
  phase: 'ACTING' | 'ROUND_SUMMARY';
  activeActorId: string;
  secretPrompt: string;
  category: string;
  timer: number;
  guesses: Array<{ playerId: string; guess: string; correct: boolean }>;
  wasGuessed: boolean;
}

// Taboo
export interface TabooCard {
  word: string;
  category: string;
  forbiddenWords: string[];
}

export interface TabooGameState {
  phase: 'CLUE_GIVING' | 'ROUND_SUMMARY';
  activeClueGiverId: string;
  card: TabooCard | null;
  timer: number;
  score: number;
  tabooTriggered: boolean;
  wordsGuessed: string[];
}

// Pictionary
export interface PictionaryGameState {
  phase: 'DRAWING' | 'ROUND_SUMMARY';
  activeArtistId: string;
  secretWord: string;
  category: string;
  timer: number;
  guesses: Array<{ playerId: string; guess: string; correct: boolean }>;
  wasGuessed: boolean;
}

// Rapid Fire
export interface RapidFireGameState {
  phase: 'QUESTION' | 'SCORING';
  activePlayerId: string;
  prompt: string;
  timer: number;
  answersGiven: number;
}

// Majority Rules
export interface MajorityRulesGameState {
  phase: 'QUESTION' | 'SUBMITTING' | 'REVEAL' | 'SCORING';
  question: string;
  submissions: Record<string, string>; // playerId -> answer
  scores: Record<string, number>;
  majorityAnswer?: string;
  timer: number;
}

// Who's Most Likely To
export interface MostLikelyGameState {
  phase: 'QUESTION' | 'VOTING' | 'REVEAL';
  prompt: string;
  votes: Record<string, string>; // voterId -> targetPlayerId
  timer: number;
}

// Hot Seat
export interface HotSeatGameState {
  phase: 'QUESTION' | 'SUBMISSION' | 'GUESSING' | 'REVEAL';
  subjectPlayerId: string;
  question: string;
  submissions: Record<string, string>; // authorPlayerId -> anonymousAnswer
  subjectGuesses: Record<string, string>; // submissionId -> guessedAuthorId
  timer: number;
}

// Two Truths and a Lie
export interface TwoTruthsGameState {
  phase: 'AUTHOR_INPUT' | 'VOTING' | 'REVEAL';
  authorPlayerId: string;
  statements: Array<{ id: string; text: string; isLie: boolean }>;
  votes: Record<string, string>; // voterId -> statementId
  timer: number;
}

// Guess the Song
export interface SongSnippet {
  id: string;
  title: string;
  artist: string;
  genre: 'bollywood' | 'punjabi' | 'international';
  year?: string;
  notesSequence?: string[]; // synthesized musical notes fallback
  audioUrl?: string;
  options: string[];
}

export interface GuessSongGameState {
  phase: 'PLAYING' | 'REVEAL';
  song: SongSnippet | null;
  timer: number;
  playerGuesses: Record<string, string>;
  correctAnswer: string;
}

// Unified Active Game State wrapper
export type ActiveGameData =
  | { mode: 'IMPOSTER'; state: ImposterGameState }
  | { mode: 'FOREHEAD_FRENZY'; state: ForeheadGameState }
  | { mode: 'AUCTION_DRAFT'; state: AuctionGameState }
  | { mode: 'DUMB_CHARADES'; state: CharadesGameState }
  | { mode: 'TABOO'; state: TabooGameState }
  | { mode: 'PICTIONARY'; state: PictionaryGameState }
  | { mode: 'RAPID_FIRE'; state: RapidFireGameState }
  | { mode: 'MAJORITY_RULES'; state: MajorityRulesGameState }
  | { mode: 'MOST_LIKELY_TO'; state: MostLikelyGameState }
  | { mode: 'HOT_SEAT'; state: HotSeatGameState }
  | { mode: 'TWO_TRUTHS_LIE'; state: TwoTruthsGameState }
  | { mode: 'GUESS_SONG'; state: GuessSongGameState };

