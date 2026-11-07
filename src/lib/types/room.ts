// Core Room and Player Types

export type PlayStyle = 'LOCAL' | 'ONLINE' | 'HYBRID';

export type GameModeId =
  | 'IMPOSTER'
  | 'FOREHEAD_FRENZY'
  | 'AUCTION_DRAFT'
  | 'DUMB_CHARADES'
  | 'TABOO'
  | 'PICTIONARY'
  | 'RAPID_FIRE'
  | 'MAJORITY_RULES'
  | 'MOST_LIKELY_TO'
  | 'HOT_SEAT'
  | 'TWO_TRUTHS_LIE'
  | 'GUESS_SONG';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  score: number;
  // In hybrid mode, multiple local players may share one client connection
  deviceId?: string;
  isLocalGuest?: boolean;
}

export type RoomStatus = 'LOBBY' | 'IN_GAME' | 'ROUND_SUMMARY' | 'GAME_OVER';

export interface BaseRoomSettings {
  maxPlayers: number;
  hostParticipates: boolean;
  roundTimeSeconds: number;
  roundsPerGame: number;
  allowSpectators: boolean;
}

export interface ImposterSettings extends BaseRoomSettings {
  selectedCategories: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  discussionTimeSeconds: number;
  votingTimeSeconds: number;
  imposterCanGuessWord: boolean;
  clueRounds: number;
}

export interface ForeheadSettings extends BaseRoomSettings {
  selectedDecks: string[];
  durationSeconds: 30 | 60 | 90 | 120;
  passLimit: number;
  enableTiltSensors: boolean;
  consecutiveBonus: boolean;
}

export interface AuctionSettings extends BaseRoomSettings {
  category: 'football' | 'clash_royale';
  startingBudget: number;
  teamSize: number;
  bidTimerSeconds: number;
  startingBid: number;
  bidIncrement: number;
}

export interface GeneralPartySettings extends BaseRoomSettings {
  selectedCategories: string[];
  timerSeconds: number;
}

export type RoomSettings = ImposterSettings & ForeheadSettings & AuctionSettings & GeneralPartySettings;

export interface RoomState {
  code: string;
  hostId: string;
  playStyle: PlayStyle;
  selectedGame: GameModeId;
  enabledGames: GameModeId[];
  status: RoomStatus;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  settings: Partial<RoomSettings>;
  createdAt: number;
  updatedAt: number;
}

