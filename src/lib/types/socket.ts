import { RoomState, PlayStyle, GameModeId } from './room';
import { ActiveGameData, AuctionAsset } from './game';

export interface ServerToClientEvents {
  // Room events
  'room:state': (state: RoomState) => void;
  'room:error': (message: string) => void;
  'room:notification': (notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string }) => void;

  // Game lifecycle
  'game:state': (data: { mode: GameModeId; state: any; myPrivateRole?: any; mySecretWord?: string }) => void;
  'game:timer_tick': (data: { secondsRemaining: number }) => void;
  'game:ended': (data: { scoreboard: Record<string, number>; winnerId?: string }) => void;

  // Real-time canvas (Pictionary)
  'pictionary:draw_data': (data: { x0: number; y0: number; x1: number; y1: number; color: string; size: number }) => void;
  'pictionary:clear': () => void;
}

export interface ClientToServerEvents {
  // Room management
  'room:create': (data: { hostName: string; playStyle: PlayStyle; gameMode: GameModeId; hostParticipates: boolean }, callback: (res: { success: boolean; code?: string; error?: string }) => void) => void;
  'room:join': (data: { code: string; playerName: string; avatar?: string; isLocalGuest?: boolean; deviceId?: string }, callback: (res: { success: boolean; player?: any; error?: string }) => void) => void;
  'room:leave': () => void;
  'room:set_ready': (isReady: boolean) => void;
  'room:update_settings': (settings: any) => void;
  'room:change_game': (mode: GameModeId) => void;
  'room:start_game': () => void;

  // Turn and game control
  'game:action': (action: { type: string; payload?: any }) => void;
  'game:skip_turn': (targetPlayerId: string) => void;
  'game:restart_round': () => void;

  // Real-time canvas
  'pictionary:draw': (data: { x0: number; y0: number; x1: number; y1: number; color: string; size: number }) => void;
  'pictionary:clear': () => void;
}

