// shared

import { Rules } from './rules.ts';

// game-related

export interface Transaction {
  userid: string;
  item: string;
  from: string;
  to: string;
  variantIndex: number;
}

export type Attachment = { itemId: string; itemView: string };

export interface Notification {
  author: string;
  visibleFor?: string[];
  message?: string;
  attachments?: Attachment[];
}

export interface RoundAction {
  time: number;
  transaction?: Transaction;
  notification?: Notification;
}

export interface GamePlayer {
  points: number;
}

// non-game related

export interface User {
  id: string;
}

export interface Message {
  author: string;
  message?: string;
  attachments: Attachment[] | null;
  visibleFor: string[] | null;
}

// todo: split in q / a
// export interface Poll {
//   author: string;
//   users: Record<string, { title: string; options: string[] }>;
//   answers: { time: number; userid: string; optionIndex: number }[];
// }

// Entities

/**
 * /groups/{id}
 */
export interface Group {
  users: string[];
}

/**
 * /groups/{id}/actions
 */
export interface GroupAction {
  time: number;
  message?: Message;
}

/**
 * todo: consider decouple game from group
 * /groups/{id}/games/{id}
 */
export interface Game {
  startTime: number | null;
  ended: { startTime: number; endTime: number } | null;
  rules: string;
  players: Record<string, GamePlayer>;
}

/**
 * /groups/{id}/games/{id}/rounds/{id}
 */
export interface Round {
  startTime: number;
  seed: number;
  actions: RoundAction[];
}

/**
 * /users/{id}
 */
export interface Profile extends User {
  name: string;
  email?: string;
  fcmToken?: string;
  img: string;
  color: string; // computed for now
}

// Refs

export interface GameRef {
  group: string;
  game: string;
}

export interface RoundRef extends GameRef {
  round: string;
}

// Decorated Entities

export type WithId<T> = { id: string } & T;
export type WithRef<Ref, T> = { ref: Ref } & T;

export interface DecoratedGame {
  game: WithRef<GameRef, Game>;
  rules: Rules;
  rounds: WithRef<RoundRef, Round>[];
}

export interface DecoratedGroup {
  group: WithId<Group>;
  games: DecoratedGame[];
  profiles: Record<string, Profile>;
}
