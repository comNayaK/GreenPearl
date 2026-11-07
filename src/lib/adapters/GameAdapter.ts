import { RoomState, Player, GameModeId } from '../types/room';

export type GameStateCallback = (data: {
  mode: GameModeId;
  state: any;
  myPrivateRole?: any;
  mySecretWord?: string;
}) => void;

export type RoomStateCallback = (state: RoomState) => void;
export type NotificationCallback = (data: { type: 'info' | 'success' | 'warning' | 'error'; message: string }) => void;

export interface IGameAdapter {
  init(): Promise<void>;
  destroy(): void;

  // Listeners
  onGameState(cb: GameStateCallback): void;
  onRoomState(cb: RoomStateCallback): void;
  onNotification(cb: NotificationCallback): void;

  // Actions
  dispatchAction(action: { type: string; payload?: any }): void;
  startGame(): void;
  restartRound(): void;
  skipTurn(targetPlayerId: string): void;
  setReady(isReady: boolean): void;
  changeGameMode(mode: GameModeId): void;
  updateSettings(settings: any): void;
}

