import { Server, Socket } from 'socket.io';
import { RoomManager } from './roomManager';
import { z } from 'zod';

const createRoomSchema = z.object({
  hostName: z.string().min(1).max(30),
  playStyle: z.enum(['LOCAL', 'ONLINE', 'HYBRID']),
  gameMode: z.string(),
  hostParticipates: z.boolean().default(true),
});

const joinRoomSchema = z.object({
  code: z.string().min(4).max(8),
  playerName: z.string().min(1).max(30),
  avatar: z.string().optional(),
  isLocalGuest: z.boolean().optional(),
  deviceId: z.string().optional(),
});

export function setupSocketHandlers(io: Server) {
  const roomManager = RoomManager.getInstance();
  roomManager.setIO(io);

  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('room:create', async (data, callback) => {
      try {
        const parsed = createRoomSchema.parse(data);
        const { code, hostPlayer } = await roomManager.createRoom(
          parsed.hostName,
          parsed.playStyle,
          parsed.gameMode as any,
          parsed.hostParticipates,
          socket.id
        );
        socket.join(code);
        if (callback) callback({ success: true, code, player: hostPlayer });
        roomManager.broadcastRoom(code);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to create room.' });
      }
    });

    // 2. Join Room
    socket.on('room:join', async (data, callback) => {
      try {
        const parsed = joinRoomSchema.parse(data);
        const res = await roomManager.joinRoom(
          parsed.code,
          parsed.playerName,
          socket.id,
          parsed.avatar,
          parsed.isLocalGuest,
          parsed.deviceId
        );

        if (res.success && res.player) {
          socket.join(parsed.code.toUpperCase());
          if (callback) callback({ success: true, player: res.player, room: res.room });
        } else {
          if (callback) callback({ success: false, error: res.error });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Invalid join parameters.' });
      }
    });

    // 3. Start Game
    socket.on('room:start_game', () => {
      const playerSockets = (roomManager as any).playerSockets;
      const info = playerSockets.get(socket.id);
      if (info) {
        roomManager.startGame(info.roomCode, info.playerId);
      }
    });

    // 4. Game Action
    socket.on('game:action', (action: { type: string; payload?: any }) => {
      const playerSockets = (roomManager as any).playerSockets;
      const info = playerSockets.get(socket.id);
      if (info) {
        roomManager.handleGameAction(info.roomCode, info.playerId, action);
      }
    });

    // 5. Change Game Mode (host only)
    socket.on('room:change_game', (mode: string) => {
      const playerSockets = (roomManager as any).playerSockets;
      const info = playerSockets.get(socket.id);
      if (info) {
        const room = roomManager.getRoom(info.roomCode);
        if (room && room.hostId === info.playerId) {
          room.selectedGame = mode as any;
          room.status = 'LOBBY';
          roomManager.broadcastRoom(info.roomCode);
        }
      }
    });

    // 6. Update Settings (host only)
    socket.on('room:update_settings', (settings: any) => {
      const playerSockets = (roomManager as any).playerSockets;
      const info = playerSockets.get(socket.id);
      if (info) {
        const room = roomManager.getRoom(info.roomCode);
        if (room && room.hostId === info.playerId) {
          room.settings = { ...room.settings, ...settings };
          roomManager.broadcastRoom(info.roomCode);
        }
      }
    });

    // 7. Pictionary Real-time Canvas Draw Events
    socket.on('pictionary:draw', (drawData: any) => {
      const playerSockets = (roomManager as any).playerSockets;
      const info = playerSockets.get(socket.id);
      if (info) {
        socket.to(info.roomCode).emit('pictionary:draw_data', drawData);
      }
    });

    socket.on('pictionary:clear', () => {
      const playerSockets = (roomManager as any).playerSockets;
      const info = playerSockets.get(socket.id);
      if (info) {
        socket.to(info.roomCode).emit('pictionary:clear');
      }
    });

    // 8. Disconnect
    socket.on('disconnect', () => {
      roomManager.handleDisconnect(socket.id);
    });
  });
}

