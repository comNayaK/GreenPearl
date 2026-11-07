import { RoomManager } from '../src/server/roomManager';
import { ImposterEngine } from '../src/lib/engine/ImposterEngine';
import { ForeheadEngine } from '../src/lib/engine/ForeheadEngine';
import { AuctionEngine } from '../src/lib/engine/AuctionEngine';
import { TeamEvaluationEngine } from '../src/lib/evaluation/teamEvaluation';
import { DatasetManager } from '../src/lib/datasets/datasetManager';
import { TurnManager } from '../src/lib/engine/TurnManager';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';

async function runComprehensiveTests() {
  console.log('=== RUNNING GREENPEARL TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. DATASET INTEGRITY & NO DUPLICATES (Item 15)
  const categories = DatasetManager.getCategories();
  let totalItems = 0;
  let totalDuplicates = 0;

  for (const cat of categories) {
    const items = DatasetManager.getItems([cat.id], 'all');
    totalItems += items.length;
    const res = DatasetManager.validateDataset(items);
    totalDuplicates += res.duplicates.length;
  }

  assert(totalItems > 1500, `Seed datasets contain rich content: ${totalItems} items`);
  assert(totalDuplicates === 0, `No unintended duplicates found across datasets (${totalDuplicates} duplicates)`);

  // 2. TURN SHUFFLING & FAIR ROTATION (Item 4)
  const players = ['player1', 'player2', 'player3', 'player4'];
  const turn1 = TurnManager.createTurnState(players, 30);
  assert(turn1.order.length === 4, 'TurnManager initializes with all players');
  const turn2 = TurnManager.nextTurn(turn1, 30);
  assert(turn2.activePlayerId === turn1.nextPlayerId, 'Next turn rotates to next queued player');
  assert(turn2.activePlayerId !== turn1.activePlayerId, 'Same player is not given consecutive turns');

  // 3. IMPOSTER ROLE SECRECY & MASKING (Item 5)
  const imposterGame = ImposterEngine.initGame(players, {
    selectedCategories: ['bollywood_movies'],
    clueRounds: 1,
    imposterCanGuessWord: true,
  });

  assert(imposterGame.secretWord.length > 0, `Secret word chosen: "${imposterGame.secretWord}"`);
  assert(players.includes(imposterGame.imposterId), `Imposter assigned: ${imposterGame.imposterId}`);

  // Test masked state for imposter
  const imposterMasked = ImposterEngine.getMaskedState(imposterGame, imposterGame.imposterId);
  assert(imposterMasked.myRole === 'IMPOSTER', 'Imposter receives IMPOSTER role');
  assert(!imposterMasked.secretWord.includes(imposterGame.secretWord), 'Imposter cannot see the secret word in masked state');

  // Test masked state for innocent
  const innocentId = players.find(p => p !== imposterGame.imposterId)!;
  const innocentMasked = ImposterEngine.getMaskedState(imposterGame, innocentId);
  assert(innocentMasked.myRole === 'INNOCENT', 'Innocent receives INNOCENT role');
  assert(innocentMasked.secretWord === imposterGame.secretWord, 'Innocent sees the secret word');

  // 4. IMPOSTER VOTING & TIED VOTES (Item 6)
  // Test tie
  let votingState = { ...imposterGame, phase: 'VOTING' as any };
  votingState = ImposterEngine.submitVote(votingState, 'player1', 'player2', players);
  votingState = ImposterEngine.submitVote(votingState, 'player2', 'player1', players);
  votingState = ImposterEngine.submitVote(votingState, 'player3', 'player2', players);
  votingState = ImposterEngine.submitVote(votingState, 'player4', 'player1', players);
  assert(votingState.isTie === true, 'Handles tied votes correctly');

  // Test unanimous catch of imposter
  let voteOutState = { ...imposterGame, phase: 'VOTING' as any, votes: {} };
  for (const p of players) {
    voteOutState = ImposterEngine.submitVote(voteOutState, p, imposterGame.imposterId, players, true);
  }
  assert(voteOutState.phase === 'IMPOSTER_GUESS', 'Identified imposter transitions to IMPOSTER_GUESS phase');

  // 5. IMPOSTER'S FINAL GUESS (Item 7)
  const wrongGuessState = ImposterEngine.submitImposterGuess(voteOutState, 'Completely Wrong Guess');
  assert(wrongGuessState.imposterGuessCorrect === false && wrongGuessState.innocentsWon === true, 'Wrong imposter guess gives innocents the win');

  const correctGuessState = ImposterEngine.submitImposterGuess(voteOutState, imposterGame.secretWord);
  assert(correctGuessState.imposterGuessCorrect === true && correctGuessState.innocentsWon === false, 'Correct imposter guess gives imposter the win');

  // 5B. PASS & PLAY IMPOSTER: VALIDATION, UNIFORMITY & NON-REPETITION
  // A. Player Count & Name Validation
  const valUnder3 = ImposterEngine.validatePlayerNames(['Alice', 'Bob']);
  assert(!valUnder3.isValid, 'Rejects fewer than 3 players');

  const valOver10 = ImposterEngine.validatePlayerNames(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
  assert(!valOver10.isValid, 'Rejects more than 10 players');

  const valEmpty = ImposterEngine.validatePlayerNames(['Alice', '', 'Charlie']);
  assert(!valEmpty.isValid, 'Rejects empty player names');

  const valDuplicates = ImposterEngine.validatePlayerNames(['Rahul', 'rahul', 'Amit']);
  assert(!valDuplicates.isValid, 'Rejects duplicate player names case-insensitively');

  const valValid = ImposterEngine.validatePlayerNames(['Aarav', 'Diya', 'Kabir', 'Rhea']);
  assert(valValid.isValid && valValid.cleanNames.length === 4, 'Accepts valid player list');

  // B. Uniform Random Selection (Imposter & Clue Starter)
  const simulationPlayers = ['P0', 'P1', 'P2', 'P3'];
  const imposterCounts = [0, 0, 0, 0];
  const starterCounts = [0, 0, 0, 0];
  const SIM_ROUNDS = 1200;

  for (let i = 0; i < SIM_ROUNDS; i++) {
    const session = ImposterEngine.initPassAndPlay({
      playerNames: simulationPlayers,
      categories: ['bollywood_movies'],
    });
    imposterCounts[session.imposterIndex]++;
    starterCounts[session.starterIndex]++;
  }

  // Each should be roughly 1200 / 4 = 300. Check bounds [210, 390]
  const imposterUniform = imposterCounts.every(c => c >= 210 && c <= 390);
  assert(imposterUniform, `Imposter chosen uniformly at random across ${SIM_ROUNDS} simulations (${imposterCounts.join(', ')})`);

  const starterUniform = starterCounts.every(c => c >= 210 && c <= 390);
  assert(starterUniform, `Clue starter chosen uniformly at random across ${SIM_ROUNDS} simulations (${starterCounts.join(', ')})`);

  // C. Word Non-Repetition within a Session
  const testCats = ['fruits_vegetables'];
  const totalFruits = DatasetManager.getItems(testCats, 'all').length;
  const sessionUsedWords = new Set<string>();

  for (let i = 0; i < totalFruits; i++) {
    const s = ImposterEngine.initPassAndPlay({
      playerNames: simulationPlayers,
      categories: testCats,
      usedWords: sessionUsedWords,
    });
    const wordKey = s.secretWord.toLowerCase().trim();
    assert(!sessionUsedWords.has(wordKey), `Round ${i + 1}: Word "${s.secretWord}" was never repeated in session`);
    sessionUsedWords.add(wordKey);
  }
  assert(sessionUsedWords.size === totalFruits, `Exhausted all ${totalFruits} words without a single repetition`);

  // Verify graceful wrap-around once pool is exhausted
  const wrapRound = ImposterEngine.initPassAndPlay({
    playerNames: simulationPlayers,
    categories: testCats,
    usedWords: sessionUsedWords,
  });
  assert(wrapRound.secretWord.length > 0, 'Gracefully resets/wraps around once word pool is completely exhausted');

  // D. Reveal Order Shuffle & Hold-to-Reveal Secrecy
  const samplePass = ImposterEngine.initPassAndPlay({
    playerNames: simulationPlayers,
    categories: ['bollywood_movies'],
  });
  assert(samplePass.revealOrder.length === 4, 'Reveal order includes all players');
  const uniqueRevealIndices = new Set(samplePass.revealOrder);
  assert(uniqueRevealIndices.size === 4, 'Reveal order contains no duplicates');

  // 6. FOREHEAD FRENZY TIMERS & SCORING (Items 8, 9)
  for (const duration of [30, 60, 90, 120] as const) {
    const fh = ForeheadEngine.initRound('guesser1', { durationSeconds: duration, passLimit: 3 });
    assert(fh.timeRemaining === duration, `Forehead Frenzy initializes with ${duration}s timer`);
  }

  let fhGame = ForeheadEngine.initRound('guesser1', { durationSeconds: 60, passLimit: 2 });
  fhGame = ForeheadEngine.startRound(fhGame);
  assert(fhGame.phase === 'PLAYING', 'Forehead round starts successfully');

  // Correct guesses update score and streak
  fhGame = ForeheadEngine.markCorrect(fhGame);
  assert(fhGame.roundScore >= 1 && fhGame.currentStreak === 1, 'Correct answer increments score and streak');

  // Skip decrements pass limit
  fhGame = ForeheadEngine.markSkip(fhGame);
  assert(fhGame.passesLeft === 1 && fhGame.currentStreak === 0, 'Skip decrements pass limit and resets streak');

  // 7. AUCTION BIDDING & OVERSPENDING PREVENTION (Item 10)
  const auctionPlayers = [
    { id: 'p1', name: 'Alice', avatar: '1', isHost: true, isReady: true, isConnected: true, score: 0 },
    { id: 'p2', name: 'Bob', avatar: '2', isHost: false, isReady: true, isConnected: true, score: 0 },
  ];
  let auction = AuctionEngine.initGame(auctionPlayers, {
    category: 'football',
    startingBudget: 25,
    teamSize: 3,
    bidTimerSeconds: 10,
  });

  assert(auction.rosters['p1'].budget === 25, 'Participants start with configured budget');
  assert(auction.currentAsset !== null, 'Auction begins with first asset in pool');

  // Valid bid
  const bid1 = AuctionEngine.placeBid(auction, 'p1', 10, 10);
  assert(!bid1.error && bid1.nextState.currentBid === 10, 'Valid bid accepted');
  auction = bid1.nextState;

  // Overspending attempt: p1 tries to bid 25, but needs 2 credits reserved for the remaining 2 slots! Max affordable: 23.
  const overbid = AuctionEngine.placeBid(auction, 'p1', 25, 10);
  assert(overbid.error !== undefined, 'Prevents bidding exceeding budget or violating empty slot reserve');

  // 8. STRUCTURED DETERMINISTIC TEAM EVALUATION (Item 11)
  const sampleFootballSquad = DatasetManager.getFootballAuctionPool(5);
  const evalFootball = TeamEvaluationEngine.evaluateFootballTeam('p1', 'Alice', sampleFootballSquad, 25, 5);
  assert(evalFootball.totalScore >= 0 && evalFootball.totalScore <= 100, `Football evaluation produces valid score: ${evalFootball.totalScore}/100 (${evalFootball.ratingTier})`);
  assert(evalFootball.pros.length > 0, 'Evaluation produces structured strengths breakdown');

  const sampleClashDeck = DatasetManager.getClashRoyaleAuctionPool(8);
  const evalClash = TeamEvaluationEngine.evaluateClashRoyaleDeck('p1', 'Alice', sampleClashDeck, 25, 4);
  assert(evalClash.totalScore >= 0 && evalClash.totalScore <= 100, `Clash Royale evaluation produces valid score: ${evalClash.totalScore}/100 (${evalClash.ratingTier})`);

  // 9. REAL-TIME SOCKET.IO MULTIPLAYER SERVER (Items 1, 2, 3, 12, 13)
  const { setupSocketHandlers } = await import('../src/server/socketHandler');
  const roomManager = RoomManager.getInstance();
  const httpServer = createServer();
  const ioServer = new Server(httpServer, { cors: { origin: '*' } });
  setupSocketHandlers(ioServer);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as any).port;
  const serverUrl = `http://localhost:${port}`;

  // Client 1 (Host) creates room
  const client1 = Client(serverUrl);
  let roomCode = '';

  await new Promise<void>((resolve) => {
    client1.on('connect', () => {
      client1.emit('room:create', {
        hostName: 'HostPlayer',
        playStyle: 'ONLINE',
        gameMode: 'IMPOSTER',
        hostParticipates: true,
      }, (res: any) => {
        assert(res.success === true && res.code.length === 6, `Host created private room: ${res.code}`);
        roomCode = res.code;
        resolve();
      });
    });
  });

  // Client 2 & Client 3 join room
  const client2 = Client(serverUrl);
  const client3 = Client(serverUrl);

  await Promise.all([
    new Promise<void>((resolve) => {
      client2.on('connect', () => {
        client2.emit('room:join', { code: roomCode, playerName: 'PlayerTwo' }, (res: any) => {
          assert(res.success === true, 'Player 2 joined room successfully');
          resolve();
        });
      });
    }),
    new Promise<void>((resolve) => {
      client3.on('connect', () => {
        client3.emit('room:join', { code: roomCode, playerName: 'PlayerThree' }, (res: any) => {
          assert(res.success === true, 'Player 3 joined room successfully');
          resolve();
        });
      });
    }),
  ]);

  const activeRoom = roomManager.getRoom(roomCode);
  assert(activeRoom?.players.length === 3, 'Multiple players synchronized in room');

  // Host starts game
  client1.emit('room:start_game');
  await new Promise(r => setTimeout(r, 200));
  assert(activeRoom?.status === 'IN_GAME', 'Host started game successfully');

  // Test reconnection
  client2.disconnect();
  await new Promise(r => setTimeout(r, 100));
  const disconnectedPlayer = activeRoom?.players.find(p => p.name === 'PlayerTwo');
  assert(disconnectedPlayer?.isConnected === false, 'Player disconnection recorded');

  // Reconnect player 2
  const client2Reconnect = Client(serverUrl);
  await new Promise<void>((resolve) => {
    client2Reconnect.on('connect', () => {
      client2Reconnect.emit('room:join', { code: roomCode, playerName: 'PlayerTwo' }, (res: any) => {
        assert(res.success === true, 'Player 2 reconnected successfully');
        assert(disconnectedPlayer?.isConnected === true, 'Reconnected player marked connected');
        resolve();
      });
    });
  });

  // Clean up
  client1.disconnect();
  client2Reconnect.disconnect();
  client3.disconnect();
  ioServer.close();
  httpServer.close();

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runComprehensiveTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});

