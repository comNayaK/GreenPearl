import {
  AuctionGameState,
  AuctionAsset,
  FootballAsset,
  ClashRoyaleAsset,
  TeamEvaluationResult,
} from '../types/game';
import { AuctionSettings, Player } from '../types/room';
import { DatasetManager } from '../datasets/datasetManager';
import { TeamEvaluationEngine } from '../evaluation/teamEvaluation';

export class AuctionEngine {
  /**
   * Initializes a new Auction Draft session
   */
  public static initGame(players: Player[], settings: Partial<AuctionSettings>): AuctionGameState {
    const category = settings.category || 'football';
    const targetTeamSize = settings.teamSize || 5;
    const startingBudget = settings.startingBudget || 25;
    const bidTimer = settings.bidTimerSeconds || 10;

    // Load pool based on category
    let availablePool: AuctionAsset[] = [];
    if (category === 'football') {
      availablePool = DatasetManager.getFootballAuctionPool(40);
    } else {
      availablePool = DatasetManager.getClashRoyaleAuctionPool(40);
    }

    const rosters: Record<string, { budget: number; assets: AuctionAsset[] }> = {};
    for (const p of players) {
      rosters[p.id] = { budget: startingBudget, assets: [] };
    }

    const firstAsset = availablePool[0] || null;

    return {
      phase: 'BIDDING',
      category,
      targetTeamSize,
      startingBudget,
      availablePool,
      currentAssetIndex: 0,
      currentAsset: firstAsset,
      currentBid: firstAsset ? firstAsset.basePrice : 1,
      currentBidderId: null,
      bidTimer,
      bidHistory: [],
      rosters,
      unsoldAssets: [],
    };
  }

  /**
   * Places a valid synchronized bid
   */
  public static placeBid(
    state: AuctionGameState,
    bidderId: string,
    amount: number,
    bidTimerSeconds: number = 10
  ): { nextState: AuctionGameState; error?: string } {
    if (state.phase !== 'BIDDING' || !state.currentAsset) {
      return { nextState: state, error: 'Bidding is not active.' };
    }

    const userRoster = state.rosters[bidderId];
    if (!userRoster) {
      return { nextState: state, error: 'Player roster not found.' };
    }

    // Check if team is already full
    if (userRoster.assets.length >= state.targetTeamSize) {
      return { nextState: state, error: 'Your team roster is already complete.' };
    }

    // Check if player already owns this asset
    if (userRoster.assets.some(a => a.id === state.currentAsset?.id)) {
      return { nextState: state, error: 'You already own this player/card.' };
    }

    // Check minimum bid requirement
    const minRequiredBid = state.currentBidderId ? state.currentBid + 1 : state.currentBid;
    if (amount < minRequiredBid) {
      return { nextState: state, error: `Bid must be at least ${minRequiredBid} credits.` };
    }

    // Check remaining slots reserve rule:
    // A player must maintain at least 1 credit for each remaining empty slot!
    const slotsRemainingAfterThis = state.targetTeamSize - (userRoster.assets.length + 1);
    const maxAffordableBid = userRoster.budget - slotsRemainingAfterThis;

    if (amount > maxAffordableBid) {
      return {
        nextState: state,
        error: `Insufficient budget! You must reserve at least ${slotsRemainingAfterThis} credits for your remaining slots. Max bid: ${maxAffordableBid}.`,
      };
    }

    // Valid bid placed! Reset bid timer
    return {
      nextState: {
        ...state,
        currentBid: amount,
        currentBidderId: bidderId,
        bidTimer: bidTimerSeconds,
        bidHistory: [
          { bidderId, amount, timestamp: Date.now() },
          ...state.bidHistory,
        ],
      },
    };
  }

  /**
   * Timer tick: decrements bid timer. When timer expires, resolves current asset!
   */
  public static tick(
    state: AuctionGameState,
    players: Player[],
    bidTimerSeconds: number = 10
  ): AuctionGameState {
    if (state.phase !== 'BIDDING') return state;

    const nextTimer = state.bidTimer - 1;
    if (nextTimer > 0) {
      return { ...state, bidTimer: nextTimer };
    }

    // Bid timer reached 0! Resolve asset
    return this.resolveCurrentAsset(state, players, bidTimerSeconds);
  }

  /**
   * Resolves the current asset: either won by highest bidder or marked unsold
   */
  public static resolveCurrentAsset(
    state: AuctionGameState,
    players: Player[],
    bidTimerSeconds: number = 10
  ): AuctionGameState {
    if (!state.currentAsset) {
      return this.finalizeAuction(state, players);
    }

    const nextRosters = { ...state.rosters };
    const nextUnsold = [...state.unsoldAssets];

    if (state.currentBidderId) {
      // Awarded to highest bidder
      const winnerRoster = nextRosters[state.currentBidderId];
      if (winnerRoster) {
        nextRosters[state.currentBidderId] = {
          budget: winnerRoster.budget - state.currentBid,
          assets: [...winnerRoster.assets, state.currentAsset],
        };
      }
    } else {
      // No bids received -> Unsold
      nextUnsold.push(state.currentAsset);
    }

    // Check if all players have completed their teams
    const allRostersComplete = Object.values(nextRosters).every(
      r => r.assets.length >= state.targetTeamSize
    );

    const nextIndex = state.currentAssetIndex + 1;
    const isPoolExhausted = nextIndex >= state.availablePool.length;

    if (allRostersComplete || isPoolExhausted) {
      // Auction completed! Trigger deterministic team evaluation
      const updatedState = {
        ...state,
        rosters: nextRosters,
        unsoldAssets: nextUnsold,
      };
      return this.finalizeAuction(updatedState, players);
    }

    // Move to next asset
    const nextAsset = state.availablePool[nextIndex];
    return {
      ...state,
      currentAssetIndex: nextIndex,
      currentAsset: nextAsset,
      currentBid: nextAsset ? nextAsset.basePrice : 1,
      currentBidderId: null,
      bidTimer: bidTimerSeconds,
      bidHistory: [],
      rosters: nextRosters,
      unsoldAssets: nextUnsold,
    };
  }

  /**
   * Finalizes auction and executes deterministic team evaluations
   */
  public static finalizeAuction(state: AuctionGameState, players: Player[]): AuctionGameState {
    const evaluations: Record<string, TeamEvaluationResult> = {};

    for (const player of players) {
      const roster = state.rosters[player.id];
      if (roster) {
        evaluations[player.id] = TeamEvaluationEngine.evaluateTeam(
          state.category,
          player.id,
          player.name,
          roster.assets,
          state.startingBudget,
          roster.budget
        );
      }
    }

    return {
      ...state,
      phase: 'AUCTION_COMPLETE',
      currentAsset: null,
      evaluations,
    };
  }
}

