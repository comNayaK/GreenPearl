import { IGameAdapter, GameStateCallback, RoomStateCallback, NotificationCallback } from './GameAdapter';
import { RoomState, Player, GameModeId } from '../types/room';
import { ImposterEngine } from '../engine/ImposterEngine';
import { ForeheadEngine } from '../engine/ForeheadEngine';
import { AuctionEngine } from '../engine/AuctionEngine';
import { PartyEngines } from '../engine/PartyEngines';
import { TurnManager } from '../engine/TurnManager';

export class LocalAdapter implements IGameAdapter {
  private roomState: RoomState;
  private currentGameState: any = null;
  private timerInterval: any = null;

  private onGameStateCb: GameStateCallback = () => {};
  private onRoomStateCb: RoomStateCallback = () => {};
  private onNotificationCb: NotificationCallback = () => {};

  // Pass-the-phone privacy cover state
  public privacyCoverActive: boolean = false;
  public pendingPlayerName: string = '';
  public activePlayerTurnId: string = '';

  constructor(playerNames: string[], defaultMode: GameModeId = 'IMPOSTER') {
    const players: Player[] = playerNames.map((name, idx) => ({
      id: `local_p_${idx + 1}`,
      name,
      avatar: `avatar_${(idx % 8) + 1}`,
      isHost: idx === 0,
      isReady: true,
      isConnected: true,
      score: 0,
      isLocalGuest: true,
    }));

    this.roomState = {
      code: 'LOCAL',
      hostId: players[0]?.id || 'local_p_1',
      playStyle: 'LOCAL',
      selectedGame: defaultMode,
      enabledGames: [defaultMode],
      status: 'LOBBY',
      players,
      currentRound: 1,
      totalRounds: 5,
      settings: {
        maxPlayers: 10,
        hostParticipates: true,
        selectedCategories: ['bollywood_movies', 'cricket_players', 'food_and_dishes'],
        difficulty: 'all',
        durationSeconds: 60,
        discussionTimeSeconds: 60,
        votingTimeSeconds: 45,
        imposterCanGuessWord: true,
        clueRounds: 1,
        startingBudget: 25,
        teamSize: 5,
        bidTimerSeconds: 10,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  public async init(): Promise<void> {
    this.broadcastRoom();
  }

  public destroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
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

  private broadcastRoom(): void {
    this.onRoomStateCb({ ...this.roomState, updatedAt: Date.now() });
  }

  private broadcastGame(myPlayerId?: string): void {
    if (!this.currentGameState) return;

    let masked = this.currentGameState;
    let myPrivateRole = undefined;
    let mySecretWord = undefined;

    if (this.roomState.selectedGame === 'IMPOSTER') {
      const viewerId = myPlayerId || this.activePlayerTurnId || this.roomState.players[0].id;
      const maskedRes = ImposterEngine.getMaskedState(this.currentGameState, viewerId);
      masked = maskedRes;
      myPrivateRole = maskedRes.myRole;
      mySecretWord = maskedRes.secretWord;
    }

    this.onGameStateCb({
      mode: this.roomState.selectedGame,
      state: masked,
      myPrivateRole,
      mySecretWord,
    });
  }

  public startGame(): void {
    this.roomState.status = 'IN_GAME';
    this.broadcastRoom();

    const playerIds = this.roomState.players.map(p => p.id);
    const mode = this.roomState.selectedGame;

    if (mode === 'IMPOSTER') {
      this.currentGameState = ImposterEngine.initGame(playerIds, this.roomState.settings as any);
      // For local Imposter, we present pass-the-phone privacy cover for role reveals!
      this.activePlayerTurnId = playerIds[0];
      this.privacyCoverActive = true;
      this.pendingPlayerName = this.roomState.players[0].name;
    } else if (mode === 'FOREHEAD_FRENZY') {
      this.activePlayerTurnId = playerIds[0];
      this.currentGameState = ForeheadEngine.initRound(playerIds[0], this.roomState.settings as any);
    } else if (mode === 'AUCTION_DRAFT') {
      this.currentGameState = AuctionEngine.initGame(this.roomState.players, this.roomState.settings as any);
      this.startAuctionTimer();
    } else if (mode === 'DUMB_CHARADES') {
      this.activePlayerTurnId = playerIds[0];
      this.currentGameState = PartyEngines.initCharades(playerIds[0]);
    } else if (mode === 'TABOO') {
      this.activePlayerTurnId = playerIds[0];
      this.currentGameState = PartyEngines.initTaboo(playerIds[0]);
    } else if (mode === 'PICTIONARY') {
      this.activePlayerTurnId = playerIds[0];
      this.currentGameState = PartyEngines.initPictionary(playerIds[0]);
    } else if (mode === 'RAPID_FIRE') {
      this.activePlayerTurnId = playerIds[0];
      this.currentGameState = PartyEngines.initRapidFire(playerIds[0]);
    } else if (mode === 'MAJORITY_RULES') {
      this.currentGameState = PartyEngines.initMajorityRules();
    } else if (mode === 'MOST_LIKELY_TO') {
      this.currentGameState = PartyEngines.initMostLikely();
    } else if (mode === 'HOT_SEAT') {
      this.activePlayerTurnId = playerIds[0];
      this.currentGameState = PartyEngines.initHotSeat(playerIds[0]);
    } else if (mode === 'TWO_TRUTHS_LIE') {
      this.activePlayerTurnId = playerIds[0];
      this.currentGameState = PartyEngines.initTwoTruths(playerIds[0]);
    } else if (mode === 'GUESS_SONG') {
      this.currentGameState = PartyEngines.initGuessSong();
    }

    this.broadcastGame();
  }

  public dispatchAction(action: { type: string; payload?: any }): void {
    if (!this.currentGameState) return;

    const mode = this.roomState.selectedGame;

    // ----------------- IMPOSTER -----------------
    if (mode === 'IMPOSTER') {
      if (action.type === 'START_CLUES') {
        this.currentGameState.phase = 'CLUE_GIVING';
        this.broadcastGame();
      } else if (action.type === 'NEXT_SPEAKER') {
        this.currentGameState = ImposterEngine.nextSpeaker(this.currentGameState);
        this.broadcastGame();
      } else if (action.type === 'START_VOTING') {
        this.currentGameState.phase = 'VOTING';
        this.broadcastGame();
      } else if (action.type === 'SUBMIT_VOTE') {
        const { voterId, votedPlayerId } = action.payload;
        const playerIds = this.roomState.players.map(p => p.id);
        this.currentGameState = ImposterEngine.submitVote(
          this.currentGameState,
          voterId,
          votedPlayerId,
          playerIds,
          this.roomState.settings.imposterCanGuessWord ?? true
        );
        this.broadcastGame();
      } else if (action.type === 'SUBMIT_IMPOSTER_GUESS') {
        this.currentGameState = ImposterEngine.submitImposterGuess(
          this.currentGameState,
          action.payload.guess
        );
        this.broadcastGame();
      } else if (action.type === 'SET_ACTIVE_LOCAL_PLAYER') {
        this.activePlayerTurnId = action.payload.playerId;
        this.broadcastGame(action.payload.playerId);
      }
    }

    // ----------------- FOREHEAD FRENZY -----------------
    if (mode === 'FOREHEAD_FRENZY') {
      if (action.type === 'START_ROUND') {
        this.currentGameState = ForeheadEngine.startRound(this.currentGameState);
        this.startForeheadTimer();
        this.broadcastGame();
      } else if (action.type === 'CORRECT') {
        this.currentGameState = ForeheadEngine.markCorrect(this.currentGameState);
        this.broadcastGame();
      } else if (action.type === 'SKIP') {
        this.currentGameState = ForeheadEngine.markSkip(this.currentGameState);
        this.broadcastGame();
      } else if (action.type === 'END_ROUND') {
        this.currentGameState = ForeheadEngine.endRound(this.currentGameState);
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.broadcastGame();
      }
    }

    // ----------------- AUCTION DRAFT -----------------
    if (mode === 'AUCTION_DRAFT') {
      if (action.type === 'PLACE_BID') {
        const { bidderId, amount } = action.payload;
        const res = AuctionEngine.placeBid(
          this.currentGameState,
          bidderId,
          amount,
          this.roomState.settings.bidTimerSeconds || 10
        );
        if (res.error) {
          this.onNotificationCb({ type: 'warning', message: res.error });
        } else {
          this.currentGameState = res.nextState;
          this.broadcastGame();
        }
      }
    }

    // ----------------- TABOO -----------------
    if (mode === 'TABOO') {
      if (action.type === 'NEXT_WORD') {
        this.currentGameState = PartyEngines.tabooNextWord(this.currentGameState, action.payload?.guessed ?? true);
        this.broadcastGame();
      }
    }

    // ----------------- MAJORITY RULES -----------------
    if (mode === 'MAJORITY_RULES') {
      if (action.type === 'SUBMIT_ANSWER') {
        const playerIds = this.roomState.players.map(p => p.id);
        this.currentGameState = PartyEngines.submitMajorityAnswer(
          this.currentGameState,
          action.payload.playerId,
          action.payload.answer,
          playerIds
        );
        this.broadcastGame();
      }
    }

    // ----------------- WHO'S MOST LIKELY -----------------
    if (mode === 'MOST_LIKELY_TO') {
      if (action.type === 'SUBMIT_VOTE') {
        const playerIds = this.roomState.players.map(p => p.id);
        this.currentGameState = PartyEngines.submitMostLikelyVote(
          this.currentGameState,
          action.payload.voterId,
          action.payload.targetId,
          playerIds
        );
        this.broadcastGame();
      }
    }
  }

  private startForeheadTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.currentGameState && this.currentGameState.phase === 'PLAYING') {
        this.currentGameState = ForeheadEngine.tick(this.currentGameState);
        if (this.currentGameState.phase === 'ROUND_SUMMARY') {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        this.broadcastGame();
      }
    }, 1000);
  }

  private startAuctionTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.currentGameState && this.currentGameState.phase === 'BIDDING') {
        this.currentGameState = AuctionEngine.tick(
          this.currentGameState,
          this.roomState.players,
          this.roomState.settings.bidTimerSeconds || 10
        );
        if (this.currentGameState.phase === 'AUCTION_COMPLETE') {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        this.broadcastGame();
      }
    }, 1000);
  }

  public restartRound(): void {
    this.startGame();
  }

  public skipTurn(targetPlayerId: string): void {
    this.onNotificationCb({ type: 'info', message: `Skipped turn for ${targetPlayerId}` });
  }

  public setReady(isReady: boolean): void {}

  public changeGameMode(mode: GameModeId): void {
    this.roomState.selectedGame = mode;
    this.roomState.status = 'LOBBY';
    this.broadcastRoom();
  }

  public updateSettings(settings: any): void {
    this.roomState.settings = { ...this.roomState.settings, ...settings };
    this.broadcastRoom();
  }
}

