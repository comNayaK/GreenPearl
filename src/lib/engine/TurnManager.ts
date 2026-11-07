import { TurnState } from '../types/game';

export class TurnManager {
  /**
   * Fairly shuffles an array of player IDs using Fisher-Yates
   */
  public static shufflePlayers(playerIds: string[]): string[] {
    const arr = [...playerIds];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Initializes a new TurnState with randomized speaking order
   */
  public static createTurnState(playerIds: string[], timeLimitSeconds: number = 30): TurnState {
    if (playerIds.length === 0) {
      return {
        order: [],
        currentIndex: 0,
        activePlayerId: '',
        nextPlayerId: '',
        roundNumber: 1,
        timeRemainingSeconds: timeLimitSeconds,
        isPaused: false,
      };
    }

    const order = this.shufflePlayers(playerIds);
    return {
      order,
      currentIndex: 0,
      activePlayerId: order[0],
      nextPlayerId: order[1 % order.length],
      roundNumber: 1,
      timeRemainingSeconds: timeLimitSeconds,
      isPaused: false,
    };
  }

  /**
   * Advances to next player in turn order
   */
  public static nextTurn(current: TurnState, timeLimitSeconds: number = 30): TurnState {
    if (current.order.length === 0) return current;

    const nextIndex = (current.currentIndex + 1) % current.order.length;
    const isNewRound = nextIndex === 0;

    return {
      ...current,
      currentIndex: nextIndex,
      activePlayerId: current.order[nextIndex],
      nextPlayerId: current.order[(nextIndex + 1) % current.order.length],
      roundNumber: isNewRound ? current.roundNumber + 1 : current.roundNumber,
      timeRemainingSeconds: timeLimitSeconds,
      isPaused: false,
    };
  }

  /**
   * Skips a player (e.g. if disconnected)
   */
  public static skipPlayer(current: TurnState, targetPlayerId: string, timeLimitSeconds: number = 30): TurnState {
    const filteredOrder = current.order.filter(id => id !== targetPlayerId);
    if (filteredOrder.length === 0) {
      return this.createTurnState([], timeLimitSeconds);
    }

    let newIndex = current.currentIndex;
    if (current.activePlayerId === targetPlayerId) {
      newIndex = current.currentIndex % filteredOrder.length;
    } else {
      const activeIdx = filteredOrder.indexOf(current.activePlayerId);
      newIndex = activeIdx >= 0 ? activeIdx : 0;
    }

    return {
      ...current,
      order: filteredOrder,
      currentIndex: newIndex,
      activePlayerId: filteredOrder[newIndex],
      nextPlayerId: filteredOrder[(newIndex + 1) % filteredOrder.length],
      timeRemainingSeconds: timeLimitSeconds,
    };
  }
}

