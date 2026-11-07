import { RoomState, Player, GameModeId, PlayStyle, RoomSettings } from '../lib/types/room';
import { ImposterEngine } from '../lib/engine/ImposterEngine';
import { ForeheadEngine } from '../lib/engine/ForeheadEngine';
import { AuctionEngine } from '../lib/engine/AuctionEngine';
import { PartyEngines } from '../lib/engine/PartyEngines';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, RoomState> = new Map();
  private gameStates: Map<string, any> = new Map();
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();
  private playerSockets: Map<string, { socketId: string; roomCode: string; playerId: string }> = new Map();

  private io: Server | null = null;

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public setIO(io: Server) {
    this.io = io;
  }

  /**
   * Generates a readable 6-character unique room code
   */
  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Creates a private room
   */
  public async createRoom(
    hostName: string,
    playStyle: PlayStyle,
    gameMode: GameModeId,
    hostParticipates: boolean = true,
    socketId: string
  ): Promise<{ code: string; hostPlayer: Player }> {
    const code = this.generateRoomCode();
    const hostPlayer: Player = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: hostName.trim() || 'Host',
      avatar: 'avatar_1',
      isHost: true,
      isReady: true,
      isConnected: true,
      score: 0,
    };

    const room: RoomState = {
      code,
      hostId: hostPlayer.id,
      playStyle,
      selectedGame: gameMode,
      enabledGames: [gameMode],
      status: 'LOBBY',
      players: [hostPlayer],
      currentRound: 1,
      totalRounds: 5,
      settings: {
        maxPlayers: 10,
        hostParticipates,
        roundTimeSeconds: 60,
        roundsPerGame: 5,
        allowSpectators: false,
        selectedCategories: ['bollywood_movies', 'cricket_players', 'food_and_dishes'],
        difficulty: 'all',
        discussionTimeSeconds: 60,
        votingTimeSeconds: 45,
        imposterCanGuessWord: true,
        clueRounds: 1,
        durationSeconds: 60,
        passLimit: 3,
        enableTiltSensors: true,
        consecutiveBonus: true,
        category: 'football',
        startingBudget: 25,
        teamSize: 5,
        bidTimerSeconds: 10,
        startingBid: 1,
        bidIncrement: 1,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.playerSockets.set(socketId, { socketId, roomCode: code, playerId: hostPlayer.id });

    // Persist to Prisma DB in background
    try {
      await prisma.room.create({
        data: {
          code,
          hostId: hostPlayer.id,
          playStyle,
          gameMode,
          status: 'LOBBY',
          settings: JSON.stringify(room.settings),
          players: {
            create: {
              id: hostPlayer.id,
              name: hostPlayer.name,
              avatar: hostPlayer.avatar,
              isHost: true,
              isReady: true,
              isConnected: true,
              score: 0,
            },
          },
        },
      });
    } catch (err) {
      console.warn('Prisma background persist notice:', err);
    }

    return { code, hostPlayer };
  }

  /**
   * Adds a player to an existing room
   */
  public async joinRoom(
    code: string,
    playerName: string,
    socketId: string,
    avatar?: string,
    isLocalGuest?: boolean,
    deviceId?: string
  ): Promise<{ success: boolean; player?: Player; room?: RoomState; error?: string }> {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return { success: false, error: 'Room not found. Check the room code and try again.' };
    }

    if (room.status !== 'LOBBY') {
      // Check if this is an existing disconnected player reconnecting
      const existing = room.players.find(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
      if (existing) {
        existing.isConnected = true;
        this.playerSockets.set(socketId, { socketId, roomCode: code, playerId: existing.id });
        this.broadcastRoom(code);
        this.broadcastGame(code);
        return { success: true, player: existing, room };
      }
      return { success: false, error: 'Game is currently in progress.' };
    }

    if (room.players.length >= (room.settings.maxPlayers || 10)) {
      return { success: false, error: 'Room is already full (max 10 players).' };
    }

    const player: Player = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerName.trim() || `Player ${room.players.length + 1}`,
      avatar: avatar || `avatar_${(room.players.length % 8) + 1}`,
      isHost: false,
      isReady: false,
      isConnected: true,
      score: 0,
      isLocalGuest,
      deviceId,
    };

    room.players.push(player);
    room.updatedAt = Date.now();
    this.playerSockets.set(socketId, { socketId, roomCode: code, playerId: player.id });

    // Persist player in DB
    try {
      await prisma.player.create({
        data: {
          id: player.id,
          roomCode: code,
          name: player.name,
          avatar: player.avatar,
          isHost: false,
          isReady: false,
          isConnected: true,
          score: 0,
        },
      });
    } catch (err) {
      console.warn('DB player create notice:', err);
    }

    this.broadcastRoom(code);
    return { success: true, player, room };
  }

  /**
   * Handles player disconnection with host migration and safe teardown
   */
  public handleDisconnect(socketId: string) {
    const playerInfo = this.playerSockets.get(socketId);
    if (!playerInfo) return;

    this.playerSockets.delete(socketId);
    const { roomCode, playerId } = playerInfo;
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.isConnected = false;

    // In lobby, if player was host, assign next player as host or delete empty room
    if (room.status === 'LOBBY') {
      room.players = room.players.filter(p => p.id !== playerId);
      if (room.players.length === 0) {
        this.closeRoom(roomCode);
        return;
      }
      if (room.hostId === playerId) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
    } else {
      // In game: check if all disconnected
      const activeCount = room.players.filter(p => p.isConnected).length;
      if (activeCount === 0) {
        // Set a 3-minute grace period before cleaning up
        setTimeout(() => {
          const current = this.rooms.get(roomCode);
          if (current && current.players.every(p => !p.isConnected)) {
            this.closeRoom(roomCode);
          }
        }, 180000);
      }
    }

    this.broadcastRoom(roomCode);
  }

  public getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public broadcastRoom(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || !this.io) return;
    this.io.to(code).emit('room:state', room);
  }

  public broadcastGame(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    const gameState = this.gameStates.get(code.toUpperCase());
    if (!room || !gameState || !this.io) return;

    // Send personalized game state to each connected player to prevent secret leaks!
    for (const [sockId, info] of this.playerSockets.entries()) {
      if (info.roomCode === code) {
        let masked = gameState;
        let myRole = undefined;
        let secret = undefined;

        if (room.selectedGame === 'IMPOSTER') {
          const maskedRes = ImposterEngine.getMaskedState(gameState, info.playerId);
          masked = maskedRes;
          myRole = maskedRes.myRole;
          secret = maskedRes.secretWord;
        }

        this.io.to(sockId).emit('game:state', {
          mode: room.selectedGame,
          state: masked,
          myPrivateRole: myRole,
          mySecretWord: secret,
        });
      }
    }
  }

  public startGame(code: string, hostPlayerId: string): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.hostId !== hostPlayerId) return false;

    room.status = 'IN_GAME';
    const playerIds = room.players.map(p => p.id);
    const mode = room.selectedGame;

    if (mode === 'IMPOSTER') {
      const state = ImposterEngine.initGame(playerIds, room.settings as any);
      this.gameStates.set(code, state);
    } else if (mode === 'FOREHEAD_FRENZY') {
      const state = ForeheadEngine.initRound(playerIds[0], room.settings as any);
      this.gameStates.set(code, state);
    } else if (mode === 'AUCTION_DRAFT') {
      const state = AuctionEngine.initGame(room.players, room.settings as any);
      this.gameStates.set(code, state);
      this.startAuctionTimer(code);
    } else if (mode === 'DUMB_CHARADES') {
      const state = PartyEngines.initCharades(playerIds[0]);
      this.gameStates.set(code, state);
    } else if (mode === 'TABOO') {
      const state = PartyEngines.initTaboo(playerIds[0]);
      this.gameStates.set(code, state);
    } else if (mode === 'PICTIONARY') {
      const state = PartyEngines.initPictionary(playerIds[0]);
      this.gameStates.set(code, state);
    } else if (mode === 'RAPID_FIRE') {
      const state = PartyEngines.initRapidFire(playerIds[0]);
      this.gameStates.set(code, state);
    } else if (mode === 'MAJORITY_RULES') {
      const state = PartyEngines.initMajorityRules();
      this.gameStates.set(code, state);
    } else if (mode === 'MOST_LIKELY_TO') {
      const state = PartyEngines.initMostLikely();
      this.gameStates.set(code, state);
    } else if (mode === 'HOT_SEAT') {
      const state = PartyEngines.initHotSeat(playerIds[0]);
      this.gameStates.set(code, state);
    } else if (mode === 'TWO_TRUTHS_LIE') {
      const state = PartyEngines.initTwoTruths(playerIds[0]);
      this.gameStates.set(code, state);
    } else if (mode === 'GUESS_SONG') {
      const state = PartyEngines.initGuessSong();
      this.gameStates.set(code, state);
    }

    this.broadcastRoom(code);
    this.broadcastGame(code);
    return true;
  }

  public handleGameAction(code: string, playerId: string, action: { type: string; payload?: any }) {
    const room = this.rooms.get(code.toUpperCase());
    let state = this.gameStates.get(code.toUpperCase());
    if (!room || !state) return;

    const mode = room.selectedGame;

    if (mode === 'IMPOSTER') {
      if (action.type === 'START_CLUES' && room.hostId === playerId) {
        state.phase = 'CLUE_GIVING';
      } else if (action.type === 'NEXT_SPEAKER') {
        state = ImposterEngine.nextSpeaker(state);
      } else if (action.type === 'START_VOTING' && room.hostId === playerId) {
        state.phase = 'VOTING';
      } else if (action.type === 'SUBMIT_VOTE') {
        const playerIds = room.players.map(p => p.id);
        state = ImposterEngine.submitVote(
          state,
          playerId,
          action.payload.votedPlayerId,
          playerIds,
          room.settings.imposterCanGuessWord ?? true
        );
      } else if (action.type === 'SUBMIT_IMPOSTER_GUESS') {
        if (state.imposterId === playerId) {
          state = ImposterEngine.submitImposterGuess(state, action.payload.guess);
        }
      }
    } else if (mode === 'FOREHEAD_FRENZY') {
      if (action.type === 'START_ROUND') {
        state = ForeheadEngine.startRound(state);
        this.startForeheadTimer(code);
      } else if (action.type === 'CORRECT') {
        state = ForeheadEngine.markCorrect(state);
      } else if (action.type === 'SKIP') {
        state = ForeheadEngine.markSkip(state);
      } else if (action.type === 'END_ROUND') {
        state = ForeheadEngine.endRound(state);
        this.clearTimer(code);
      }
    } else if (mode === 'AUCTION_DRAFT') {
      if (action.type === 'PLACE_BID') {
        const res = AuctionEngine.placeBid(
          state,
          playerId,
          action.payload.amount,
          room.settings.bidTimerSeconds || 10
        );
        if (res.error) {
          const sock = Array.from(this.playerSockets.values()).find(
            s => s.roomCode === code && s.playerId === playerId
          );
          if (sock && this.io) {
            this.io.to(sock.socketId).emit('room:notification', { type: 'warning', message: res.error });
          }
          return;
        }
        state = res.nextState;
      }
    } else if (mode === 'TABOO') {
      if (action.type === 'NEXT_WORD') {
        state = PartyEngines.tabooNextWord(state, action.payload?.guessed ?? true);
      }
    } else if (mode === 'MAJORITY_RULES') {
      if (action.type === 'SUBMIT_ANSWER') {
        const playerIds = room.players.map(p => p.id);
        state = PartyEngines.submitMajorityAnswer(state, playerId, action.payload.answer, playerIds);
      }
    } else if (mode === 'MOST_LIKELY_TO') {
      if (action.type === 'SUBMIT_VOTE') {
        const playerIds = room.players.map(p => p.id);
        state = PartyEngines.submitMostLikelyVote(state, playerId, action.payload.targetId, playerIds);
      }
    }

    this.gameStates.set(code.toUpperCase(), state);
    this.broadcastGame(code);
  }

  private startForeheadTimer(code: string) {
    this.clearTimer(code);
    const timer = setInterval(() => {
      let state = this.gameStates.get(code.toUpperCase());
      if (state && state.phase === 'PLAYING') {
        state = ForeheadEngine.tick(state);
        this.gameStates.set(code.toUpperCase(), state);
        if (state.phase === 'ROUND_SUMMARY') {
          this.clearTimer(code);
        }
        this.broadcastGame(code);
      }
    }, 1000);
    this.roomTimers.set(code.toUpperCase(), timer);
  }

  private startAuctionTimer(code: string) {
    this.clearTimer(code);
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return;

    const timer = setInterval(() => {
      let state = this.gameStates.get(code.toUpperCase());
      if (state && state.phase === 'BIDDING') {
        state = AuctionEngine.tick(state, room.players, room.settings.bidTimerSeconds || 10);
        this.gameStates.set(code.toUpperCase(), state);
        if (state.phase === 'AUCTION_COMPLETE') {
          this.clearTimer(code);
        }
        this.broadcastGame(code);
      }
    }, 1000);
    this.roomTimers.set(code.toUpperCase(), timer);
  }

  private clearTimer(code: string) {
    const existing = this.roomTimers.get(code.toUpperCase());
    if (existing) {
      clearInterval(existing);
      this.roomTimers.delete(code.toUpperCase());
    }
  }

  public closeRoom(code: string) {
    this.clearTimer(code);
    this.rooms.delete(code.toUpperCase());
    this.gameStates.delete(code.toUpperCase());
  }
}

