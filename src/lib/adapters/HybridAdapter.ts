import { io, Socket } from 'socket.io-client';
import { IGameAdapter, GameStateCallback, RoomStateCallback, NotificationCallback } from './GameAdapter';
import { RoomState, GameModeId, Player } from '../types/room';

export class HybridAdapter implements IGameAdapter {
  private socket: Socket | null = null;
  private roomCode: string;
  private localPlayerNames: string[];
  public activeLocalPlayerIndex: number = 0;

  private onGameStateCb: GameStateCallback = () => {};
  private onRoomStateCb: RoomStateCallback = () => {};
  private onNotificationCb: NotificationCallback = () => {};

  constructor(roomCode: string, localPlayerNames: string[]) {
    this.roomCode = roomCode;
    this.localPlayerNames = localPlayerNames.length > 0 ? localPlayerNames : ['Local Player 1'];
  }

  public async init(): Promise<void> {
    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });

    this.socket.on('connect', () => {
      // Register all local players sequentially or as a local team cluster
      this.socket?.emit(
        'room:join',
        {
          code: this.roomCode,
          playerName: this.localPlayerNames[0],
          deviceId: 'hybrid_host_device',
        },
        (res: any) => {
          if (!res?.success) {
            this.onNotificationCb({ type: 'error', message: res?.error || 'Failed to join room.' });
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

