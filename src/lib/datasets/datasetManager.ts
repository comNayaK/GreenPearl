import footballPlayers from './data/football_players.json';
import footballClubs from './data/football_clubs.json';
import clashRoyaleCards from './data/clash_royale_cards.json';
import bollywoodMovies from './data/bollywood_movies.json';
import bollywoodActors from './data/bollywood_actors.json';
import bollywoodActresses from './data/bollywood_actresses.json';
import hindiSongs from './data/hindi_songs.json';
import punjabiSongs from './data/punjabi_songs.json';
import cricketPlayers from './data/cricket_players.json';
import foodDishes from './data/food_and_dishes.json';
import fruitsVeg from './data/fruits_vegetables.json';
import cities from './data/cities.json';
import animeAndGames from './data/anime_and_games.json';
import tvShows from './data/tv_shows.json';
import carsAndBrands from './data/cars_and_brands.json';
import tabooCards from './data/taboo_cards.json';
import partyPrompts from './data/party_prompts.json';
import gameOfThrones from './data/game_of_thrones.json';
import strangerThings from './data/stranger_things.json';
import animeCharacters from './data/anime_characters.json';
import professions from './data/professions.json';
import superheroesVillains from './data/superheroes_and_villains.json';
import mythologicalFigures from './data/mythological_figures.json';

import { FootballAsset, ClashRoyaleAsset, TabooCard } from '../types/game';

export interface DatasetItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  region?: string;
  aliases?: string[];
}

export interface CategoryMetadata {
  id: string;
  label: string;
  count: number;
  description: string;
  subcategories: string[];
}

// In-memory custom entries added dynamically by users
let customWordEntries: DatasetItem[] = [];

export class DatasetManager {
  /**
   * Returns list of all available categories and metadata
   */
  public static getCategories(): CategoryMetadata[] {
    return [
      { id: 'bollywood_movies', label: 'Bollywood Movies', count: bollywoodMovies.length, description: 'Iconic Hindi cinema from classics to modern blockbusters', subcategories: ['Classics', 'Romance', 'Action', 'Comedy'] },
      { id: 'bollywood_actors', label: 'Bollywood Actors', count: bollywoodActors.length, description: 'Legendary and contemporary Hindi cinema leading men', subcategories: ['Superstars', 'Method Actors', 'Veterans'] },
      { id: 'bollywood_actresses', label: 'Bollywood Actresses', count: bollywoodActresses.length, description: 'Iconic leading ladies of Hindi cinema', subcategories: ['Golden Era', 'Modern Stars', 'Award Winners'] },
      { id: 'hindi_songs', label: 'Hindi Songs', count: hindiSongs.length, description: 'Chartbusters, romantic anthems, and party tracks', subcategories: ['Romantic', 'Dance', 'Sad/Sufi', 'Classics'] },
      { id: 'punjabi_songs', label: 'Punjabi Songs', count: punjabiSongs.length, description: 'High-energy Punjabi music, hip-hop, and folk-pop', subcategories: ['Desi Hip Hop', 'Party Anthems', 'Pop'] },
      { id: 'cricket_players', label: 'Cricket Players', count: cricketPlayers.length, description: 'Indian cricket stars and global all-time greats', subcategories: ['Indian Team', 'International Stars', 'Legends'] },
      { id: 'football_players', label: 'Football Players', count: footballPlayers.length, description: 'Top international & Indian football stars with detailed ratings', subcategories: ['Premier League', 'La Liga', 'Serie A', 'Legends', 'ISL'] },
      { id: 'football_clubs', label: 'Football Clubs', count: footballClubs.length, description: 'European powerhouses, Indian clubs, and world giants', subcategories: ['European Giants', 'Premier League', 'Indian Clubs'] },
      { id: 'clash_royale_cards', label: 'Clash Royale Cards', count: clashRoyaleCards.length, description: 'Complete authentic cards with Elixir cost and battle stats', subcategories: ['Troops', 'Spells', 'Buildings', 'Champions'] },
      { id: 'food_and_dishes', label: 'Food & Dishes', count: foodDishes.length, description: 'North Indian delicacies, street food, and global favorites', subcategories: ['North Indian', 'Street Food', 'Desserts', 'Continental'] },
      { id: 'fruits_vegetables', label: 'Fruits & Vegetables', count: fruitsVeg.length, description: 'Common, exotic, and desi produce', subcategories: ['Fruits', 'Vegetables'] },
      { id: 'cities', label: 'Cities & Places', count: cities.length, description: 'Indian cities, hill stations, and world capitals', subcategories: ['India', 'Global Destinations'] },
      { id: 'anime_and_games', label: 'Anime & Video Games', count: animeAndGames.length, description: 'Legendary anime characters and popular video games', subcategories: ['Shonen Anime', 'PC/Console Games', 'Mobile Hits'] },
      { id: 'tv_shows', label: 'TV & Web Shows', count: tvShows.length, description: 'Indian web series, classic serials, and international hits', subcategories: ['Indian Web Series', 'Sitcoms', 'Drama'] },
      { id: 'cars_and_brands', label: 'Cars & Brands', count: carsAndBrands.length, description: 'Supercars, Indian SUVs, and worldwide mega-brands', subcategories: ['Cars', 'Brands'] },
      { id: 'game_of_thrones', label: 'Game of Thrones', count: gameOfThrones.length, description: 'Westeros heroes, villains, and kings from the iconic series', subcategories: ['Starks', 'Lannisters', 'Targaryens', 'Night Watch'] },
      { id: 'stranger_things', label: 'Stranger Things', count: strangerThings.length, description: 'Hawkins crew, Upside Down creatures, and iconic 80s characters', subcategories: ['The Kids', 'Teens & Adults', 'Upside Down', 'Scientists'] },
      { id: 'anime_characters', label: 'Anime Characters', count: animeCharacters.length, description: 'Legendary heroes, senseis, villains, and rivals across top anime', subcategories: ['Shonen Protagonists', 'Hokage & Sensei', 'Villains', 'Fan Favorites'] },
      { id: 'professions', label: 'Professions & Jobs', count: professions.length, description: 'Diverse occupations, dream jobs, and specialized roles', subcategories: ['Medical & STEM', 'Creative & Arts', 'Public Service', 'Specialized'] },
      { id: 'superheroes_and_villains', label: 'Superheroes & Villains', count: superheroesVillains.length, description: 'Marvel, DC, and pop culture comic champions and arch-villains', subcategories: ['Marvel', 'DC'] },
      { id: 'mythological_figures', label: 'Mythology & Legends', count: mythologicalFigures.length, description: 'Gods, demigods, monsters, and warriors from Greek, Norse, and Indian lore', subcategories: ['Greek', 'Norse', 'Indian', 'Egyptian'] },
    ];
  }

  /**
   * Retrieves items for specified categories with optional difficulty filter
   */
  public static getItems(categories: string[], difficulty: 'easy' | 'medium' | 'hard' | 'all' = 'all'): DatasetItem[] {
    const pool: DatasetItem[] = [];

    const categoryMap: Record<string, any[]> = {
      bollywood_movies: bollywoodMovies,
      bollywood_actors: bollywoodActors,
      bollywood_actresses: bollywoodActresses,
      hindi_songs: hindiSongs,
      punjabi_songs: punjabiSongs,
      cricket_players: cricketPlayers,
      football_players: footballPlayers,
      football_clubs: footballClubs,
      clash_royale_cards: clashRoyaleCards,
      food_and_dishes: foodDishes,
      fruits_vegetables: fruitsVeg,
      cities: cities,
      anime_and_games: animeAndGames,
      tv_shows: tvShows,
      cars_and_brands: carsAndBrands,
      game_of_thrones: gameOfThrones,
      stranger_things: strangerThings,
      anime_characters: animeCharacters,
      professions: professions,
      superheroes_and_villains: superheroesVillains,
      mythological_figures: mythologicalFigures,
    };

    const targetCategories = categories.length === 0 ? Object.keys(categoryMap) : categories;

    for (const cat of targetCategories) {
      const items = categoryMap[cat] || [];
      for (const item of items) {
        if (difficulty === 'all' || !item.difficulty || item.difficulty === difficulty) {
          pool.push(item);
        }
      }
    }

    // Add matching custom items
    for (const custom of customWordEntries) {
      if (targetCategories.includes(custom.category) || targetCategories.includes('custom')) {
        if (difficulty === 'all' || !custom.difficulty || custom.difficulty === difficulty) {
          pool.push(custom);
        }
      }
    }

    return pool;
  }

  /**
   * Pick random items without repetition
   */
  public static getRandomItems(categories: string[], count: number, difficulty: 'easy' | 'medium' | 'hard' | 'all' = 'all'): DatasetItem[] {
    const pool = this.getItems(categories, difficulty);
    if (pool.length === 0) {
      // Fallback if no category selected
      return this.getRandomItems(['bollywood_movies'], count, 'all');
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Pick one random item, optionally avoiding already used words until the pool is exhausted
   */
  public static getRandomWord(
    categories: string[],
    difficulty: 'easy' | 'medium' | 'hard' | 'all' = 'all',
    usedWords?: Set<string>
  ): DatasetItem {
    const allItems = this.getItems(categories, difficulty);
    const pool = allItems.length > 0 ? allItems : this.getItems(['bollywood_movies'], 'all');

    if (usedWords && usedWords.size > 0) {
      const unused = pool.filter(item => !usedWords.has(item.name.toLowerCase().trim()));
      if (unused.length > 0) {
        const randomIndex = Math.floor(Math.random() * unused.length);
        return unused[randomIndex];
      }
      // Pool exhausted: fallback to all items in pool
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex] || { id: 'fallback', name: '3 Idiots', category: 'bollywood_movies' };
  }

  /**
   * Auction pool generator for Football
   */
  public static getFootballAuctionPool(count: number = 30): FootballAsset[] {
    const list = [...(footballPlayers as FootballAsset[])];
    return list.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  /**
   * Auction pool generator for Clash Royale
   */
  public static getClashRoyaleAuctionPool(count: number = 30): ClashRoyaleAsset[] {
    const list = [...(clashRoyaleCards as ClashRoyaleAsset[])];
    return list.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  /**
   * Taboo cards pool
   */
  public static getRandomTabooCards(count: number = 10): TabooCard[] {
    const list = [...(tabooCards as TabooCard[])];
    return list.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  /**
   * Party prompts for games like Majority Rules, Most Likely To, Hot Seat, Rapid Fire
   */
  public static getPartyPrompt(type: 'majorityRules' | 'mostLikelyTo' | 'hotSeat' | 'rapidFire'): string {
    const raw = (partyPrompts as any)[0] || partyPrompts;
    const list = raw[type] || [];
    if (list.length === 0) return 'What is the greatest party moment ever?';
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Add a custom word entry
   */
  public static addCustomWord(entry: Omit<DatasetItem, 'id'>): DatasetItem {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: DatasetItem = { ...entry, id };
    customWordEntries.push(newEntry);
    return newEntry;
  }

  /**
   * Validate dataset array for duplicates or missing fields
   */
  public static validateDataset(items: any[]): { isValid: boolean; duplicates: string[]; errors: string[] } {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const errors: string[] = [];

    items.forEach((item, index) => {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        errors.push(`Item at index ${index} is missing a valid 'name' attribute.`);
      } else {
        const normalized = item.name.trim().toLowerCase();
        if (seen.has(normalized)) {
          duplicates.push(item.name);
        } else {
          seen.add(normalized);
        }
      }
    });

    return {
      isValid: duplicates.length === 0 && errors.length === 0,
      duplicates,
      errors
    };
  }

  /**
   * Export all datasets as a JSON blob
   */
  public static exportAll(): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      customWords: customWordEntries,
      categoriesCount: this.getCategories().reduce((acc, cat) => ({ ...acc, [cat.id]: cat.count }), {})
    }, null, 2);
  }
}

