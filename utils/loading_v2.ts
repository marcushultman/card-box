import { RULES_DB } from './rules.ts';

import app from '@firebase';
import db from '@firestore';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  CollectionReference,
  deleteDoc,
  deleteField,
  doc,
  documentId,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  getDocs,
  increment,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  QuerySnapshot,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  combineLatest,
  defaultIfEmpty,
  firstValueFrom,
  map,
  Observable,
  of,
  skipWhile,
  switchMap,
} from 'rxjs';
import toIdMap from './id_map.ts';
import {
  DecoratedGame,
  DecoratedGroup,
  Game,
  GamePlayer,
  GameRef,
  Group,
  GroupAction,
  Message,
  Profile,
  Round,
  RoundAction,
  RoundRef,
  Transaction,
  WithId,
  WithRef,
} from './model_v2.ts';

type DeleteField = ReturnType<typeof deleteField>;

// Rules

export async function loadRules(rulesId: string) {
  await null;
  return RULES_DB[rulesId];
}

// Firebase building blocks

function unwrapDoc<T>(s: DocumentSnapshot): WithId<T> {
  return { id: s.id, ...s.data() };
}

function unwrapQuery<T>(q: QuerySnapshot) {
  return q.docs.map((s) => unwrapDoc<T>(s));
}

function onDoc<T>(ref: DocumentReference) {
  return new Observable<DocumentSnapshot>((s) => onSnapshot(ref, s)).pipe(
    map((s) => unwrapDoc<T>(s)),
  );
}

function onQuery<T>(ref: CollectionReference, ...constraints: QueryConstraint[]) {
  return new Observable<QuerySnapshot>((s) => onSnapshot(query(ref, ...constraints), s)).pipe(
    map((q) => unwrapQuery<T>(q)),
  );
}

// Profiles

const EMPTY_PROFILE = { name: '', color: '', img: '' };

export function onProfiles(idSet: Set<string>) {
  if (!idSet.size) {
    return of([]);
  }
  const ids = [...idSet];
  const colors = ['#ff6698', '#ffb366', '#ffff66', '#98ff66', '#6698ff'];

  return onQuery<Omit<Profile, 'color'>>(
    collection(db, 'users'),
    where(documentId(), 'in', ids),
  ).pipe(
    skipWhile((profiles) => ids.length !== profiles.length),
    map((profiles) =>
      profiles.map<Profile>(({ id, ...props }) => {
        const color = colors[id.charCodeAt(0) % colors.length];
        return { ...EMPTY_PROFILE, id, color, ...props };
      })
    ),
  );
}

export function onProfile(id: string) {
  return onProfiles(new Set([id])).pipe(map(([profile]) => profile));
}

export function loadProfiles(idSet: Set<string>) {
  return firstValueFrom(onProfiles(idSet));
}

export function loadProfile(id: string) {
  return firstValueFrom(onProfile(id));
}

export async function updateProfile(
  id: string,
  update: Partial<Profile | Record<keyof Profile, DeleteField>>,
) {
  const data = typeof update.name === 'string'
    ? { ...update, _name: update.name.toLocaleLowerCase() }
    : update;
  await setDoc(doc(db, 'users', id), data, { merge: true });
}

// Search user

export function searchProfileOp(text: string) {
  const lowerCaseText = text.toLocaleLowerCase();
  return onQuery<Profile>(
    collection(db, 'users'),
    where('_name', '>=', lowerCaseText),
    where('_name', '<=', lowerCaseText + '\uf8ff'),
  );
}

// Group

export function groupPlayerIds({ users }: Group, game?: Game) {
  const players = Object.keys(game?.players ?? {});
  return new Set([...users, ...players]);
}

function onGroupProfiles(group: Group, game?: Game) {
  return onProfiles(groupPlayerIds(group, game)).pipe(map(toIdMap));
}

function decorateGroup(
  group: WithId<Group>,
  games: DecoratedGame[],
): Observable<Omit<DecoratedGroup, 'actions'>> {
  // todo: read from cache and determine if valid
  const game = games.at(-1)?.game;

  return onGroupProfiles(group, game).pipe(map((profiles) => ({ group, games, profiles })));
}

type FirebaseUser = { uid: string; displayName: string | null; photoURL: string | null };

function onLoggedInUser() {
  const auth = getAuth(app);
  return new Observable<FirebaseUser>((s) => onAuthStateChanged(auth, s));
}

function onGroup(id: string) {
  return onDoc<Group>(doc(db, 'groups', id));
}

function onGames(group: string, ids?: string[]) {
  return onQuery<Game>(
    collection(db, 'groups', group, 'games'),
    ...ids
      ? [where(documentId(), 'in', ids)]
      : [orderBy('startTime'), where('startTime', '!=', null), limitToLast(1)],
  );
}

function onRounds({ group, game }: GameRef) {
  return onQuery<Round>(
    collection(db, 'groups', group, 'games', game, 'rounds'),
    orderBy('startTime'),
  );
}

function onGroupsForUser(userId: string) {
  return onQuery<Group>(collection(db, 'groups'), where('users', 'array-contains', userId));
}

function withRoundRef(ref: GameRef, round: WithId<Round>): WithRef<RoundRef, Round> {
  return { ref: { ...ref, round: round.id }, ...round };
}

function withGameRef(group: string, game: WithId<Game>): WithRef<GameRef, Game> {
  return { ref: { group, game: game.id }, ...game };
}

function onGameRounds(game: WithRef<GameRef, Game>): Observable<DecoratedGame> {
  return combineLatest([loadRules(game.rules), onRounds(game.ref)]).pipe(
    map(([rules, rounds]) => ({
      game,
      rules,
      rounds: rounds.map((round) => withRoundRef(game.ref, round)),
    })),
  );
}

function onDecoratedGroupGames(group: WithId<Group>, games: WithId<Game>[]) {
  return combineLatest(games.map((game) => onGameRounds(withGameRef(group.id, game)))).pipe(
    defaultIfEmpty([]),
    switchMap((games) => decorateGroup(group, games)),
  );
}

export function onGroupActions(id: string, limit = 512) {
  return limit === 0 ? of([]) : onQuery<GroupAction>(
    collection(db, 'groups', id, 'actions'),
    orderBy('time'),
    limitToLast(limit),
  );
}

export interface LoadGroupsPolicy {
  actions?: number;
  games?: string[];
}

export function onDecoratedGroup(id: string, { actions, games }: LoadGroupsPolicy = {}) {
  return combineLatest([
    combineLatest([
      onGroup(id),
      onGames(id, games),
    ]).pipe(switchMap(([group, games]) => onDecoratedGroupGames(group, games))),
    onGroupActions(id, actions),
  ]).pipe(map(([group, actions]): DecoratedGroup => ({ ...group, actions })));
}

export function onDecoratedGroupsForUser(
  userId: string,
  { actions, games }: LoadGroupsPolicy = {},
) {
  return onGroupsForUser(userId).pipe(switchMap((groups) =>
    combineLatest(
      groups.map((group) =>
        combineLatest([
          onGames(group.id, games).pipe(switchMap((games) => onDecoratedGroupGames(group, games))),
          onGroupActions(group.id, actions),
        ]).pipe(map(([group, actions]): DecoratedGroup => ({ ...group, actions })))
      ),
    ).pipe(defaultIfEmpty([] as DecoratedGroup[]))
  ));
}

// todo: switchMap on loggedInUser in order to pass firebase security rules
// export function onGroupActionsAuth(id: string) {
//   return onLoggedInUser().pipe(
//     // todo: filter out non-logged in state
//     tap((user) => console.log('LoggedInUser', user)),
//     switchMap(() =>
//       onQuery<GroupAction>(
//         collection(db, 'groups', id, 'actions'),
//         orderBy('time'),
//         limitToLast(512),
//       )
//     ),
//   );
// }

export function loadDecoratedGroup(id: string, policy?: LoadGroupsPolicy) {
  return firstValueFrom(onDecoratedGroup(id, policy));
}

export function loadDecoratedGroupsForUser(userId: string, policy?: LoadGroupsPolicy) {
  return firstValueFrom(onDecoratedGroupsForUser(userId, policy));
}

export function loadGroupActions(id: string, limit?: number) {
  return firstValueFrom(onGroupActions(id, limit));
}

// Group

export function makeGroupId(): string {
  return doc(collection(db, 'groups')).id;
}

export async function createGroup(users: string[]): Promise<string> {
  const group: Group = { users };
  const ref = await addDoc(collection(db, 'groups'), group);
  return ref.id;
}

export async function addGroupUser(groupId: string, userIds: string[]) {
  await setDoc(doc(db, 'groups', groupId), { users: arrayUnion(...userIds) }, { merge: true });
}

export async function removeGroupUser(groupId: string, userId: string[]) {
  await setDoc(doc(db, 'groups', groupId), { users: arrayRemove(...userId) }, { merge: true });
}

function addGroupAction(groupId: string, props: Partial<GroupAction>) {
  const action: GroupAction = { time: Date.now(), ...props };
  return [
    action,
    addDoc(collection(db, 'groups', groupId, 'actions'), action)
      .then(({ id }): WithId<GroupAction> => ({ id, ...action })),
  ] as const;
}

export function addMessage(groupId: string, message: Message) {
  return addGroupAction(groupId, { message });
}

export async function removeMessage(groupId: string, messageId: string) {
  await deleteDoc(doc(db, 'groups', groupId, 'actions', messageId));
}

// Game

const gameColl = (group: string) => collection(db, 'groups', group, 'games');
const gameDoc = (ref: GameRef) => doc(db, 'groups', ref.group, 'games', ref.game);

export async function addGame(
  groupId: string,
  rulesId: string,
  users: string[],
): Promise<DecoratedGame> {
  const players = Object.fromEntries(users.map<[string, GamePlayer]>((id) => [id, { points: 0 }]));
  const game: Game = { startTime: Date.now(), ended: null, rules: rulesId, players };
  const [{ id }, rules] = await Promise.all([addDoc(gameColl(groupId), game), loadRules(rulesId)]);
  const ref = { group: groupId, game: id };
  return { game: { ref, ...game }, rules, rounds: [await addRound(ref)] };
}

export async function endGame(ref: GameRef, startTime: number) {
  const ended = { startTime, endTime: Date.now() };
  await updateDoc(gameDoc(ref), 'startTime', null, 'ended', ended);
  return ended;
}

export async function incrementPoints(ref: GameRef, userId: string) {
  await updateDoc(gameDoc(ref), new FieldPath('players', userId, 'points'), increment(1));
}

export async function decrementPoints(ref: GameRef, userId: string) {
  await updateDoc(gameDoc(ref), new FieldPath('players', userId, 'points'), increment(-1));
}

export async function resetPoints(ref: GameRef, userId: string) {
  await updateDoc(gameDoc(ref), new FieldPath('players', userId, 'points'), 0);
}

// Round

const roundColl = (r: GameRef) => collection(db, 'groups', r.group, 'games', r.game, 'rounds');
const roundDoc = (r: RoundRef) => doc(db, 'groups', r.group, 'games', r.game, 'rounds', r.round);

export async function addRound(ref: GameRef): Promise<WithRef<RoundRef, Round>> {
  const seed = 42;
  const round: Round = { startTime: Date.now(), seed, actions: [] };
  const { id } = await addDoc(roundColl(ref), round);
  return { ref: { ...ref, round: id }, ...round };
}

async function addRoundAction(ref: RoundRef, props: Partial<RoundAction>) {
  const action: RoundAction = { time: Date.now(), ...props };
  const update = { actions: arrayUnion(action) };
  await updateDoc(roundDoc(ref), update);
  return action;
}

export function addTransaction(ref: RoundRef, transaction: Transaction) {
  return addRoundAction(ref, { transaction });
}

// Develop

export async function clearGames(group: string) {
  const batch = writeBatch(db);
  const { docs } = await getDocs(query(gameColl(group)));
  docs.forEach((doc) => batch.delete(doc.id));
  await batch.commit();
}

export async function clearActions(ref: RoundRef) {
  await updateDoc(roundDoc(ref), { actions: [] });
}
