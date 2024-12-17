import type {
  Post,
  RedditAPIClient,
  RedisClient,
  Scheduler,
  ZRangeOptions,
} from "@devvit/public-api";
import { Devvit } from "@devvit/public-api";
import { Dictionary, GameSettings } from "../types.js";
// Service that handles the backbone logic for the application
// * Storing and fetching the score board
// * Storing and fetching dynamic dictionaries

export class Service {
  readonly redis: RedisClient;
  readonly reddit?: RedditAPIClient;
  readonly scheduler?: Scheduler;
  constructor(context: {
    redis: RedisClient;
    reddit?: RedditAPIClient;
    scheduler?: Scheduler;
  }) {
    this.redis = context.redis;
    this.reddit = context.reddit;
    this.scheduler = context.scheduler;
  }
  readonly tags = {
    scores: "default",
  };

  readonly keys = {
    dictionary: (dictionaryName: string) => `dictionary:${dictionaryName}`,
    dictionaries: "dictionaries",
    gameSettings: "game-settings",
    // guessComments: (postId: PostId) => `guess-comments:${postId}`,
    // postData: (postId: PostId) => `post:${postId}`,
    // postGuesses: (postId: PostId) => `guesses:${postId}`,
    // postSkipped: (postId: PostId) => `skipped:${postId}`,
    // postSolved: (postId: PostId) => `solved:${postId}`,
    // postUserGuessCounter: (postId: PostId) => `user-guess-counter:${postId}`,
    scores: `pixels:${this.tags.scores}`,
    userData: (username: string) => `users:${username}`,
    userDrawings: (username: string) => `user-drawings:${username}`,
    wordDrawings: (word: string) => `word-drawings:${word}`,
  };

  /*
   * Game settings
   */

  async storeGameSettings(settings: {
    [field: string]: string;
  }): Promise<void> {
    const key = this.keys.gameSettings;
    await this.redis.hSet(key, settings);
  }

  async getGameSettings(): Promise<GameSettings> {
    const key = this.keys.gameSettings;
    return (await this.redis.hGetAll(key)) as GameSettings;
  }

  /*
   * Submit Guess
   */

  // TODO

  /*
   * Leaderboard
   */

  async getScores(maxLength: number = 10): Promise<any[]> {
    const options: ZRangeOptions = { reverse: true, by: "rank" };
    return await this.redis.zRange(this.keys.scores, 0, maxLength - 1, options);
  }

  async getUserScore(username: string | null): Promise<{
    rank: number;
    score: number;
  }> {
    const defaultValue = { rank: -1, score: 0 };
    if (!username) return defaultValue;
    try {
      const [rank, score] = await Promise.all([
        this.redis.zRank(this.keys.scores, username),
        // TODO: Remove .zScore when .zRank supports the WITHSCORE option
        this.redis.zScore(this.keys.scores, username),
      ]);
      return {
        rank: rank === undefined ? -1 : rank,
        score: score === undefined ? 0 : score,
      };
    } catch (error) {
      if (error) {
        console.error("Error fetching user score board entry", error);
      }
      return defaultValue;
    }
  }

  async incrementUserScore(username: string, amount: number): Promise<number> {
    // if (this.scheduler === undefined) {
    //   console.error('Scheduler not available in Service');
    //   return 0;
    // }
    const key = this.keys.scores;
    const prevScore = (await this.redis.zScore(key, username)) ?? 0;
    const nextScore = await this.redis.zIncrBy(key, username, amount);
    // const prevLevel = getLevelByScore(prevScore);
    // const nextLevel = getLevelByScore(nextScore);
    // if (nextLevel.rank > prevLevel.rank) {
    //   await this.scheduler.runJob({
    //     name: 'USER_LEVEL_UP',
    //     data: {
    //       username,
    //       score: nextScore,
    //       prevLevel,
    //       nextLevel,
    //     },
    //     runAt: new Date(),
    //   });
    // }

    return nextScore;
  }

  /*
   * Dictionary
   */

  async saveDictionary(dictionaryName: string, words: string[]): Promise<void> {
    const json = JSON.stringify(words);
    const key = this.keys.dictionary(dictionaryName);
    await Promise.all([
      this.redis.set(key, json),
      this.redis.zAdd(this.keys.dictionaries, {
        member: dictionaryName,
        score: Date.now(),
      }),
    ]);
  }
  async upsertDictionary(
    dictionaryName: string,
    newWords: string[]
  ): Promise<{
    rows: number;
    uniqueNewWords: string[];
    duplicatesNotAdded: string[];
  }> {
    const key = this.keys.dictionary(dictionaryName);
    const existingJSON = await this.redis.get(key);
    const existingWords = existingJSON ? JSON.parse(existingJSON) : [];

    const uniqueNewWords = newWords.filter(
      (word) => !existingWords.includes(word)
    );
    const duplicatesNotAdded = newWords.filter((word) =>
      existingWords.includes(word)
    );

    const updatedWordsJson = JSON.stringify(
      Array.from(new Set([...existingWords, ...newWords]))
    );

    await this.saveDictionary(dictionaryName, JSON.parse(updatedWordsJson));
    return { rows: uniqueNewWords.length, uniqueNewWords, duplicatesNotAdded };
  }

  async removeWordFromDictionary(
    dictionaryName: string,
    wordsToRemove: string[]
  ): Promise<{
    removedCount: number;
    removedWords: string[];
    notFoundWords: string[];
  }> {
    const key = this.keys.dictionary(dictionaryName);
    const existingJSON = await this.redis.get(key);
    const existingWords: string[] = existingJSON
      ? JSON.parse(existingJSON)
      : [];
    const updatedWords = existingWords.filter(
      (word) => !wordsToRemove.includes(word)
    );

    const removedCount = existingWords.length - updatedWords.length;
    const removedWords = wordsToRemove.filter((word) =>
      existingWords.includes(word)
    );
    const notFoundWords = wordsToRemove.filter(
      (word) => !removedWords.includes(word)
    );

    await this.saveDictionary(dictionaryName, updatedWords);
    return { removedCount, removedWords, notFoundWords };
  }

  async getActiveDictionaries(): Promise<Dictionary[]> {
    // Determine which dictionaries to fetch
    const gameSettings = await this.getGameSettings();
    const defaultDictionary = "main";
    const dictionaries = [gameSettings.selectedDictionary];
    if (gameSettings.selectedDictionary !== defaultDictionary) {
      dictionaries.push(defaultDictionary);
    }

    // Fetch and parse the dictionaries
    return await Promise.all(
      dictionaries.map(async (dictionaryName) => {
        const key = this.keys.dictionary(dictionaryName);
        const dictionaryJsonString = await this.redis.get(key);
        const parsedDictionary: string[] = dictionaryJsonString
          ? JSON.parse(dictionaryJsonString)
          : [];
        return {
          name: dictionaryName,
          words: parsedDictionary,
        };
      })
    );
  }

  async selectDictionary(dictionaryName: string): Promise<void> {
    const gameSettings = await this.getGameSettings();
    gameSettings.selectedDictionary = dictionaryName;
    await this.storeGameSettings(gameSettings);
    await this.redis.zAdd(this.keys.dictionaries, {
      member: dictionaryName,
      score: Date.now(),
    });
  }

  async getAllDictionaryNames(): Promise<string[]> {
    const data =
      (await this.redis.zRange(this.keys.dictionaries, 0, -1, {
        by: "rank",
        reverse: true,
      })) ?? [];
    return data.map((value) => value.member);
  }
}
