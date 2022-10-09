import { Class, Item, RepeatValue, Repetition, RULES_DB, Surface, Value } from './rules.ts';
import shuffleInPlace from './shuffle.ts';
import Random from './random.ts';

import db from '@firestore';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  Bytes,
  clearIndexedDbPersistence,
  collection,
  disableNetwork,
  doc,
  DocumentSnapshot,
  enableNetwork,
  getDoc,
  getDocs,
  onSnapshot,
  terminate,
  writeBatch,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import Automerge, { BinaryDocument } from 'automerge';

// ====== Connectivity

export async function goOffline() {
  await disableNetwork(db);
}

export async function goOnline() {
  await enableNetwork(db);
}

export async function clearCache() {
  await terminate(db);
  await clearIndexedDbPersistence(db);
  window.location.reload();
}

// ====== Game - needs to be serializable, as they are loaded as island props ======

export interface Action {
  userid: string;
  from: string;
  to: string;
  item: string;
  time: number;
}

export enum ChatMessageType {
  SYSTEM,
  USER,
}

export interface ChatMessage {
  type: ChatMessageType;
  userid?: string;
  message: string;
  time: number;
}

export interface Player {
  id: string;
  name: string;
  img: string;
}

export interface Round {
  time: number;
  seed: number;
  players: string[];
  actions: Action[];
}

export interface Game {
  waitingPlayers: string[];
  rules: string;
  messages: ChatMessage[];
  rounds: Round[];
}

// ============ (these are also currently rendered on the server and passed to SurfaceView island)

export interface Repeated {
  index: number;
  value?: Value;
}

export type RepeatedValue<T> = { repeated?: Repeated } & T;

export interface DecoratedItem extends RepeatedValue<Item> {
  id: string;
}

export interface DecoratedSurface extends RepeatedValue<Surface> {
  id: string;
  items: DecoratedItem[];
}

export interface LocalSurface extends Omit<Surface, 'itemViews'> {
  itemView: Class;
}

export interface DecoratedLocalSurface extends RepeatedValue<LocalSurface> {
  id: string;
  items: DecoratedItem[];
}

function collectSurfaceById<T extends { id: string }>(surfaces: T[]) {
  return surfaces.reduce(
    (byId, surface) => (byId[surface.id] = surface, byId),
    {} as Record<string, T>,
  );
}

export function calculateSurfaces(game: Game) {
  if (game.rounds.length === 0) {
    throw new Error('waiting to start');
  }

  const round = game.rounds[game.rounds.length - 1];

  const rules = RULES_DB[game.rules].configs.find(
    (config) => round.players.length <= (config.when?.maxPlayers ?? Infinity),
  );

  if (!rules) {
    throw new Error('no rules');
  }
  const random = new Random(round.seed);

  const expandRepeat = (repeat?: Repetition): (Repeated | undefined)[] => {
    if (!repeat) {
      return [undefined];
    } else if ('forEach' in repeat) {
      return Array(repeat.times ?? 1).fill(0).flatMap(
        () => round.players.map((value, index) => ({ value, index })),
      );
    }
    return Array(repeat.times).fill(0).map((_, i) => ({ value: i, index: i }));
  };

  const expand = <T>(list: RepeatValue<T>[]): RepeatedValue<T>[] =>
    list.flatMap(({ repeat, ...props }) =>
      expandRepeat(repeat).map((repeated) => ({ repeated, ...props as T }))
    );

  const surfaces = expand(rules.surfaces ?? [])
    .map<DecoratedSurface>(({ repeated, ...props }) => ({
      ...props,
      repeated,
      id: random.nextGid(),
      items: [],
    }));

  for (const collection of rules.collections ?? []) {
    const items = expand(collection.deck.items)
      .map<DecoratedItem>(({ repeated, ...props }) => ({
        ...props,
        repeated,
        id: random.nextGid(),
      }));

    // deno-lint-ignore no-constant-condition
    if (collection.shuffle && false) {
      shuffleInPlace(items, random);
    }

    for (const { repeated, surfaceClass } of expand(collection.distributions ?? [])) {
      const targetSurfaces = surfaces.filter((surface) => surface.class === surfaceClass);
      const surface = targetSurfaces[(repeated?.index ?? 0) % targetSurfaces.length];
      if (!surface) {
        throw new Error(`No surface matching '${surfaceClass}'`);
      }
      // todo: if not repeated, divide the items equally among the targetSurfaces
      surface.items.push(...items.splice(0, repeated ? 1 : items.length));
    }

    if (items.length) {
      throw new Error('Missing item distributions');
    }
  }

  const surfaceById = collectSurfaceById(surfaces);

  for (const action of round.actions) {
    const from = surfaceById[action.from];
    const to = surfaceById[action.to];
    const itemIndex = from.items.findIndex((item) => item.id === action.item);
    if (itemIndex < 0) {
      continue;
    }
    to.items.push(...from.items.splice(itemIndex, 1));
  }

  const itemById = surfaces.reduce(
    (byId, surface) => (surface.items.forEach((item) => (byId[item.id] = item)), byId),
    {} as Record<string, Item>,
  );

  return { surfaces, surfaceById, itemById };
}

export function calculateLocalState(game: Game, userid: string) {
  const { surfaces: allSurfaces, itemById } = calculateSurfaces(game);

  const localSurfaces: DecoratedLocalSurface[] = [], surfaces: DecoratedLocalSurface[] = [];

  allSurfaces.forEach(
    ({ repeated, itemViews, ...props }) => {
      const isLocal = repeated?.value === userid;
      (isLocal ? localSurfaces : surfaces).push({
        repeated,
        itemView: (isLocal ? itemViews.local : undefined) ?? itemViews.default,
        ...props,
      });
    },
  );

  if (!localSurfaces.length) {
    throw new Error(`can't find surfaces for '${userid}'`);
  }

  const surfaceById = { ...collectSurfaceById(surfaces), ...collectSurfaceById(localSurfaces) };

  return { localSurfaces, surfaces, surfaceById, itemById };
}

// util

export function decorateAction(game: Game, e: Action) {
  const { surfaceById, itemById } = calculateSurfaces(game);
  const from = surfaceById[e.from];
  const to = surfaceById[e.to];
  const item = itemById[e.item];
  return { from, to, item };
}

// modifications

interface Data {
  docs: Bytes[];
}

export async function createGame(rules: string): Promise<string> {
  const game = Automerge.change(Automerge.init<Game>(), 'create', (game) => {
    game.waitingPlayers = ['adam', 'eve'];
    game.rules = rules;
    game.messages = [];
    game.rounds = [];
  });
  const data: Data = { docs: [Bytes.fromUint8Array(Automerge.save(game))] };
  const ref = await addDoc(collection(db, 'games'), data);
  return ref.id;
}

const toDocs = (data: Data) => data.docs.map((doc) => doc.toUint8Array());

export function load<T>(docs: Uint8Array[]) {
  return docs.map((doc) => Automerge.load<T>(doc as BinaryDocument)).reduce(Automerge.merge);
}

export async function loadGames() {
  const snapshots = await getDocs(collection(db, 'games'));
  return snapshots.docs.map((snapshot) => ({
    id: snapshot.id,
    game: load<Game>(toDocs(snapshot.data())),
  }));
}

export async function loadGame(id: string) {
  const snapshot: DocumentSnapshot = await getDoc(doc(db, 'games', id));
  if (!snapshot.exists()) {
    throw new Error('Failed to load game');
  }
  return load<Game>(toDocs(snapshot.data()));
}

export function loadPlayers(playerIds: Round['players']) {
  const colors = ['ff6698', 'ffb366', 'ffff66', '98ff66', '6698ff'];
  return playerIds.map<Player>((id, i) => ({
    id,
    name: [id[0].toLocaleUpperCase(), ...id.slice(1)].join(''),
    img: `https://via.placeholder.com/64/${colors[i % colors.length]}/FFFFFF?text=${id}`,
  }));
}

export function loadRules(rulesId: Game['rules']) {
  return RULES_DB[rulesId];
}

export function onDocs(id: string) {
  return new Observable<Uint8Array[]>((subscriber) => {
    const unsub = onSnapshot(doc(db, 'games', id), (snapshot: DocumentSnapshot) => {
      snapshot.exists()
        ? subscriber.next(toDocs(snapshot.data()))
        : subscriber.error(new Error('Failed to load game'));
    });
    return () => unsub();
  });
}

function arrEquals(lhs: Uint8Array, rhs: Uint8Array) {
  if (lhs === rhs) {
    return true;
  }
  return lhs.length !== rhs.length && lhs.every((val, i) => val === rhs[i]);
}

async function updateDocs(id: string, newDoc: Uint8Array, oldDocs: Uint8Array[]) {
  if (oldDocs.some((docs) => arrEquals(newDoc, docs))) {
    console.info('Skipping update');
    return;
  }
  const ref = doc(db, 'games', id);
  await writeBatch(db)
    .update(ref, { docs: arrayUnion(Bytes.fromUint8Array(newDoc)) })
    .update(ref, { docs: arrayRemove(...oldDocs.map((doc) => Bytes.fromUint8Array(doc))) })
    .commit();
}

function changeGame(
  id: string,
  game: Game,
  oldDocs: Uint8Array[],
  callback: Automerge.ChangeFn<Game>,
) {
  return updateDocs(id, Automerge.save(Automerge.change(game, callback)), oldDocs);
}

export function joinGame(
  id: string,
  game: Game,
  oldDocs: Uint8Array[],
  userid: string,
) {
  return changeGame(
    id,
    game,
    oldDocs,
    (game) => game.waitingPlayers.push(userid),
  );
}

export function startRound(
  id: string,
  game: Game,
  oldDocs: Uint8Array[],
) {
  return changeGame(
    id,
    game,
    oldDocs,
    (game) => {
      const lastRound = game.rounds.length ? game.rounds[game.rounds.length - 1] : undefined;
      const time = Date.now();
      game.rounds.push({
        time,
        seed: time,
        players: [
          ...lastRound?.players ?? [],
          ...game.waitingPlayers,
        ],
        actions: [],
      });
      game.waitingPlayers.splice(0, game.waitingPlayers.length);
    },
  );
}

export function addAction(
  id: string,
  game: Game,
  oldDocs: Uint8Array[],
  action: Omit<Action, 'time'>,
) {
  if (action.to === action.from) {
    return;
  }
  if (game.rounds.length === 0) {
    return;
  }
  return changeGame(
    id,
    game,
    oldDocs,
    (game) => {
      const round = game.rounds[game.rounds.length - 1];
      round.actions.push({ ...action, time: Date.now() });
    },
  );
}

export function addChatMessage(
  id: string,
  game: Game,
  oldDocs: Uint8Array[],
  userid: string,
  message: string,
) {
  return changeGame(
    id,
    game,
    oldDocs,
    (game) => game.messages.push({ type: ChatMessageType.USER, userid, message, time: Date.now() }),
  );
}

export function addSystemMessage(
  id: string,
  game: Game,
  oldDocs: Uint8Array[],
  message: string,
) {
  return changeGame(
    id,
    game,
    oldDocs,
    (game) => game.messages.push({ type: ChatMessageType.SYSTEM, message, time: Date.now() }),
  );
}

export function resetGame(id: string, game: Game, oldDocs: Uint8Array[], hard: boolean) {
  return changeGame(id, game, oldDocs, (game) => {
    if (hard) {
      game.rounds.splice(0, game.rounds.length);
      game.messages.splice(0, game.messages.length);
      game.waitingPlayers.splice(0, game.waitingPlayers.length);
    } else {
      if (game.rounds.length) {
        const round = game.rounds[game.rounds.length - 1];
        round.actions.splice(0, round.actions.length);
      }
      game.messages.push({
        type: ChatMessageType.SYSTEM,
        message: 'game reset',
        time: Date.now(),
      });
    }
  });
}

// const LOCAL = {
//   player: 'adam',
//   surface: 'hand',
// };
