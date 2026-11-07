import {
  CharadesGameState,
  TabooGameState,
  PictionaryGameState,
  RapidFireGameState,
  MajorityRulesGameState,
  MostLikelyGameState,
  HotSeatGameState,
  TwoTruthsGameState,
  GuessSongGameState,
  TabooCard,
} from '../types/game';
import { DatasetManager } from '../datasets/datasetManager';

export class PartyEngines {
  // -------------------------------------------------------------
  // DUMB CHARADES
  // -------------------------------------------------------------
  public static initCharades(actorId: string, categories: string[] = ['bollywood_movies']): CharadesGameState {
    const word = DatasetManager.getRandomWord(categories, 'all');
    return {
      phase: 'ACTING',
      activeActorId: actorId,
      secretPrompt: word.name,
      category: word.category || 'Movies',
      timer: 60,
      guesses: [],
      wasGuessed: false,
    };
  }

  // -------------------------------------------------------------
  // TABOO
  // -------------------------------------------------------------
  public static initTaboo(clueGiverId: string): TabooGameState {
    const cards = DatasetManager.getRandomTabooCards(1);
    const card = cards[0] || {
      word: 'Biryani',
      category: 'Food',
      forbiddenWords: ['Rice', 'Chicken', 'Spices', 'Hyderabadi', 'Plate'],
    };

    return {
      phase: 'CLUE_GIVING',
      activeClueGiverId: clueGiverId,
      card,
      timer: 60,
      score: 0,
      tabooTriggered: false,
      wordsGuessed: [],
    };
  }

  public static tabooNextWord(state: TabooGameState, guessed: boolean): TabooGameState {
    const cards = DatasetManager.getRandomTabooCards(1);
    const nextCard = cards[0] || state.card;

    return {
      ...state,
      card: nextCard,
      score: guessed ? state.score + 1 : state.score,
      wordsGuessed: guessed && state.card ? [...state.wordsGuessed, state.card.word] : state.wordsGuessed,
      tabooTriggered: false,
    };
  }

  // -------------------------------------------------------------
  // PICTIONARY
  // -------------------------------------------------------------
  public static initPictionary(artistId: string, categories: string[] = ['food_and_dishes', 'cities']): PictionaryGameState {
    const word = DatasetManager.getRandomWord(categories, 'all');
    return {
      phase: 'DRAWING',
      activeArtistId: artistId,
      secretWord: word.name,
      category: word.category || 'General',
      timer: 75,
      guesses: [],
      wasGuessed: false,
    };
  }

  // -------------------------------------------------------------
  // RAPID FIRE
  // -------------------------------------------------------------
  public static initRapidFire(playerId: string): RapidFireGameState {
    const prompt = DatasetManager.getPartyPrompt('rapidFire');
    return {
      phase: 'QUESTION',
      activePlayerId: playerId,
      prompt,
      timer: 30,
      answersGiven: 0,
    };
  }

  // -------------------------------------------------------------
  // MAJORITY RULES
  // -------------------------------------------------------------
  public static initMajorityRules(): MajorityRulesGameState {
    const question = DatasetManager.getPartyPrompt('majorityRules');
    return {
      phase: 'SUBMITTING',
      question,
      submissions: {},
      scores: {},
      timer: 45,
    };
  }

  public static submitMajorityAnswer(state: MajorityRulesGameState, playerId: string, answer: string, allPlayers: string[]): MajorityRulesGameState {
    const nextSubmissions = { ...state.submissions, [playerId]: answer.trim() };
    const allSubmitted = allPlayers.every(id => nextSubmissions[id] !== undefined);

    if (!allSubmitted) {
      return { ...state, submissions: nextSubmissions };
    }

    // Tally normalized answers to find majority
    const tally: Record<string, number> = {};
    for (const ans of Object.values(nextSubmissions)) {
      const norm = ans.toLowerCase();
      tally[norm] = (tally[norm] || 0) + 1;
    }

    let topNorm = '';
    let maxVotes = 0;
    for (const [norm, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        topNorm = norm;
      }
    }

    // Award +2 to everyone who matched the majority
    const scores: Record<string, number> = {};
    for (const [pId, ans] of Object.entries(nextSubmissions)) {
      if (ans.toLowerCase() === topNorm && maxVotes > 1) {
        scores[pId] = 2;
      } else {
        scores[pId] = 0;
      }
    }

    return {
      ...state,
      submissions: nextSubmissions,
      scores,
      majorityAnswer: topNorm,
      phase: 'REVEAL',
    };
  }

  // -------------------------------------------------------------
  // WHO'S MOST LIKELY TO
  // -------------------------------------------------------------
  public static initMostLikely(): MostLikelyGameState {
    const prompt = DatasetManager.getPartyPrompt('mostLikelyTo');
    return {
      phase: 'VOTING',
      prompt,
      votes: {},
      timer: 30,
    };
  }

  public static submitMostLikelyVote(state: MostLikelyGameState, voterId: string, targetId: string, allPlayers: string[]): MostLikelyGameState {
    const nextVotes = { ...state.votes, [voterId]: targetId };
    const allVoted = allPlayers.every(id => nextVotes[id] !== undefined);

    return {
      ...state,
      votes: nextVotes,
      phase: allVoted ? 'REVEAL' : 'VOTING',
    };
  }

  // -------------------------------------------------------------
  // HOT SEAT
  // -------------------------------------------------------------
  public static initHotSeat(subjectPlayerId: string): HotSeatGameState {
    const question = DatasetManager.getPartyPrompt('hotSeat');
    return {
      phase: 'SUBMISSION',
      subjectPlayerId,
      question,
      submissions: {},
      subjectGuesses: {},
      timer: 45,
    };
  }

  // -------------------------------------------------------------
  // TWO TRUTHS AND A LIE
  // -------------------------------------------------------------
  public static initTwoTruths(authorPlayerId: string): TwoTruthsGameState {
    return {
      phase: 'AUTHOR_INPUT',
      authorPlayerId,
      statements: [],
      votes: {},
      timer: 60,
    };
  }

  // -------------------------------------------------------------
  // GUESS THE SONG
  // -------------------------------------------------------------
  public static initGuessSong(): GuessSongGameState {
    const songItem = DatasetManager.getRandomWord(['hindi_songs', 'punjabi_songs'], 'all');
    const optionsPool = DatasetManager.getRandomItems(['hindi_songs', 'punjabi_songs'], 3, 'all').map(i => i.name);
    const options = [songItem.name, ...optionsPool].sort(() => 0.5 - Math.random());

    return {
      phase: 'PLAYING',
      song: {
        id: songItem.id,
        title: songItem.name,
        artist: 'Popular Artist',
        genre: songItem.category === 'punjabi_songs' ? 'punjabi' : 'bollywood',
        options,
      },
      timer: 20,
      playerGuesses: {},
      correctAnswer: songItem.name,
    };
  }
}

