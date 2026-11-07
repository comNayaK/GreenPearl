import { io, Socket } from 'socket.io-client';
import { IGameAdapter, GameStateCallback, RoomStateCallback, NotificationCallback } from './GameAdapter';
import { RoomState, GameModeId } from '../types/room';

export class OnlineAdapter implements IGameAdapter {
  private socket: Socket | null = null;
  private roomCode: string;
  private playerName: string;
  private isHost: boolean;

  private onGameStateCb: GameStateCallback = () => {};
  private onRoomStateCb: RoomStateCallback = () => {};
  private onNotificationCb: NotificationCallback = () => {};

  constructor(roomCode: string, playerName: string, isHost: boolean = false) {
    this.roomCode = roomCode;
    this.playerName = playerName;
    this.isHost = isHost;
  }

  public async init(): Promise<void> {
    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      // Auto rejoin or authenticate
      this.socket?.emit(
        'room:join',
        {
          code: this.roomCode,
          playerName: this.playerName,
        },
        (res: any) => {
          if (!res?.success) {
            this.onNotificationCb({ type: 'error', message: res?.error || 'Failed to connect to room.' });
          }
        }
      );
    });

    this.socket.on('room:state', (state: RoomState) => {
      this.onRoomStateCb(state);
    });

    this.socket.on('game:state', (data: any) => {
      this.onGameStateCb(data);
    });

    this.socket.on('room:notification', (notif: any) => {
      this.onNotificationCb(notif);
    });

    this.socket.on('room:error', (msg: string) => {
      this.onNotificationCb({ type: 'error', message: msg });
    });
  }

  public destroy(): void {
    if (this.socket) {
      this.socket.emit('room:leave');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public onGameState(cb: GameStateCallback): void {
    this.onGameStateCb = cb;
  }

  public onRoomState(cb: RoomStateCallback): void {
    this.onRoomStateCb = cb;
  }

  public onNotification(cb: NotificationCallback): void {
    this.onNotificationCb = cb;
  }

  public dispatchAction(action: { type: string; payload?: any }): void {
    this.socket?.emit('game:action', action);
  }

  public startGame(): void {
    this.socket?.emit('room:start_game');
  }

  public restartRound(): void {
    this.socket?.emit('game:restart_round');
  }

  public skipTurn(targetPlayerId: string): void {
    this.socket?.emit('game:skip_turn', targetPlayerId);
  }

  public setReady(isReady: boolean): void {
    this.socket?.emit('room:set_ready', isReady);
  }

  public changeGameMode(mode: GameModeId): void {
    this.socket?.emit('room:change_game', mode);
  }

  public updateSettings(settings: any): void {
    this.socket?.emit('room:update_settings', settings);
  }
}

