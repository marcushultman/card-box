import { batch, Signal, signal } from '@preact/signals-core';
import { useEffect, useMemo } from 'preact/hooks';
import {
  DecoratedGame,
  DecoratedGroup,
  Game,
  GamePlayer,
  GameRef,
  GroupAction,
  Message,
  Profile,
  Round,
  RoundAction,
  RoundRef,
  Transaction,
  WithRef,
} from './model_v2.ts';
import * as loading from './loading_v2.ts';
import { Rules } from './rules.ts';
import mapValues from './map_values.ts';
import { groupPlayerIds, onDecoratedGroup, onGroupActions, onProfiles } from './loading_v2.ts';
import { combineLatest, firstValueFrom, map, tap } from 'rxjs';
import toIdMap from './id_map.ts';

// state

export interface GamePlayerState {
  points: Signal<number>;
}

export interface RoundState {
  ref: RoundRef;
  startTime: number;
  seed: number;
  actions: Signal<RoundAction[]>;
}

export interface GameState {
  ref: GameRef;
  startTime: Signal<number | null>;
  ended: Signal<Game['ended']>;
  rules: Rules;
  rounds: Signal<RoundState[]>;
  players: Signal<Record<string, GamePlayerState>>;
}

export interface GroupState {
  id: string;
  users: Signal<string[]>;
  games: Signal<GameState[]>;
  profiles: Signal<Record<string, Profile>>;
  actions: Signal<GroupAction[]>;
}

const toRoundState = ({ ref, startTime, seed, actions }: WithRef<RoundRef, Round>): RoundState => ({
  ref,
  startTime,
  seed,
  actions: signal(actions),
});
const toPlayerState = ({ points }: GamePlayer): GamePlayerState => ({ points: signal(points) });
const toGameState = (
  { game: { ref, startTime, ended, players }, rules, rounds }: DecoratedGame,
): GameState => ({
  ref,
  startTime: signal(startTime),
  ended: signal(ended),
  rules,
  rounds: signal(rounds.map(toRoundState)),
  players: signal(mapValues(players, toPlayerState)),
});

const toGroupState = (
  { group, games, profiles }: DecoratedGroup,
  actions: GroupAction[],
): GroupState => ({
  id: group.id,
  users: signal(group.users),
  games: signal(games.map(toGameState)),
  profiles: signal(profiles),
  actions: signal(actions),
});

export type GroupUsers = Pick<GroupState, 'id' | 'users'>;
export type GroupGames = Pick<GroupState, 'id' | 'games'>;
export type GroupActions = Pick<GroupState, 'id' | 'actions'>;
export type GameRounds = Pick<GameState, 'ref' | 'rounds'>;
export type GamePlayers = Pick<GameState, 'ref' | 'players'>;
export type RoundActions = Pick<RoundState, 'ref' | 'actions'>;

// Group state

export async function addGroupUser({ id, users }: GroupUsers, userId: string[]) {
  await loading.addGroupUser(id, userId);
  users.value = [...users.value, ...userId];
}

export async function removeGroupUser({ id, users }: GroupUsers, userId: string[]) {
  await loading.removeGroupUser(id, userId);
  users.value = users.value.filter((u) => !userId.includes(u));
}

export async function addMessage({ id, actions }: GroupActions, message: Message) {
  const action = await firstValueFrom(loading.addMessage(id, message));
  actions.value = [...actions.value, action];
}

export async function resetGame({ id, games }: GroupGames, hard: boolean) {
  if (hard) {
    await loading.clearGames(id);
  } else {
    const ref = games.value.at(-1)?.rounds.value.at(-1)?.ref;
    if (ref) {
      await loading.clearActions(ref);
    }
  }
}

// Game state

export async function addGame({ id, games, users }: GroupState) {
  const game = await loading.addGame(id, 'loveletter', users.value);
  games.value = [...games.value, toGameState(game)];
  return game.game.ref;
}

export async function endGame(state: GameState) {
  if (state.startTime.value) {
    const ended = await loading.endGame(state.ref, state.startTime.value);
    batch(() => {
      state.startTime.value = null;
      state.ended.value = ended;
    });
  }
}

export async function incrementPoints(ref: GameRef, id: string, player: GamePlayerState) {
  ++player.points.value;
  await loading.incrementPoints(ref, id);
}

export async function decrementPoints(ref: GameRef, id: string, player: GamePlayerState) {
  --player.points.value;
  await loading.decrementPoints(ref, id);
}

export async function resetPoints(ref: GameRef, id: string, player: GamePlayerState) {
  player.points.value = 0;
  await loading.resetPoints(ref, id);
}

export async function addRound({ ref, rounds }: GameRounds) {
  const round = await loading.addRound(ref);
  rounds.value = [...rounds.value, toRoundState(round)];
}

// Round state

export async function addTransaction({ ref, actions }: RoundActions, transaction: Transaction) {
  const action = await loading.addTransaction(ref, transaction);
  actions.value = [...actions.value, action];
}

// /*
// export function addPoll(
//   id: string,
//   game: Signal<Game>,
//   author: string,
//   users: Record<string, { title: string; options: string[] }>,
// ) {
//   return changeGame(
//     id,
//     game,
//     (game) => game.actions.push({
//       time: Date.now(),
//       poll: {
//         author, users, answers: []
//       }
//     }),
//   );
// }

// export function addPollAnswer(
//   id: string,
//   game: Signal<Game>,
//   userid: string,
//   pollTime: number,
//   optionIndex: number,
// ) {
//   return changeGame(
//     id,
//     game,
//     (game) => {
//       const poll = game.polls.find((poll) => poll.time === pollTime);
//       poll?.answers.push({ time: Date.now(), userid, optionIndex });
//     },
//   );
// }
// */

// Subscription

function keepProfilesUpToDate(profiles: Signal<Profile>[]) {
  console.log('keepProfilesUpToDate');
  return onProfiles(new Set(profiles.map((p) => p.value.id))).pipe(
    map(toIdMap),
    tap((profileData) => {
      console.log('keepProfilesUpToDate cb', Object.keys(profileData).length);
      profiles.forEach((profile) => {
        profile.value = profileData[profile.value.id];
      });
    }),
  );
}

function keepUpToDate(group: GroupState) {
  console.log('keepUpToDate');

  return combineLatest([onDecoratedGroup(group.id), onGroupActions(group.id)]).pipe(
    map(([groupData, actions]) => toGroupState(groupData, actions)),
    tap(({ users, games, profiles, actions }) =>
      batch(() => {
        console.log('keepUpToDate cb');
        group.users.value = users.peek();
        group.games.value = games.peek();
        group.profiles.value = profiles.peek();
        group.actions.value = actions.peek();
      })
    ),
  );
}

// Hook for auto-updating state

export function useProfiles(profilesData: Profile[]) {
  const profiles = useMemo(() => profilesData.map((profile) => signal(profile)), []);
  useEffect(() => {
    const s = keepProfilesUpToDate(profiles).subscribe();
    return () => s.unsubscribe();
  }, []);
  return profiles;
}

export function useGroupState(groupData: DecoratedGroup, actions: GroupAction[]) {
  const group = useMemo(() => toGroupState(groupData, actions), []);
  useEffect(() => {
    const s = keepUpToDate(group).subscribe();
    return () => s.unsubscribe();
  }, []);
  return group;
}

// Accessors

const EMPTY_PROFILE = { name: '', color: '', img: '' };

export function getPlayers(
  users: string[],
  players: Record<string, GamePlayerState>,
  profiles: Record<string, Profile>,
) {
  return [...groupPlayerIds({ users })].map((id) => ({
    ...EMPTY_PROFILE,
    ...profiles[id],
    inGroup: id in users,
    player: id in players ? players[id] : undefined,
  }));
}

export function getPlayersFromGroupState({ users, games, profiles }: GroupState) {
  const players = games.value.at(-1)?.players.value ?? {};
  return getPlayers(users.value, players, profiles.value);
}
