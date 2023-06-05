import { ForEach, RepeatValue, Repetition, Rules } from './rules.ts';
import shuffleInPlace from './shuffle.ts';
import Random from './random.ts';
import toIdMap from './id_map.ts';
import { Transaction } from './model_v2.ts';
import {
  DecoratedItem,
  DecoratedLocalSurface,
  DecoratedSurface,
  Repeated,
  RepeatedValue,
} from './rules_v2.ts';
import mapValues from './map_values.ts';
import { GameState, GroupState, RoundState } from './state_v2.ts';

export function currentRound(group: GroupState) {
  const game = group.games.value.at(-1);
  const round = game?.rounds.value.at(-1);
  return { game, round };
}

export function viewForItem(surface: DecoratedLocalSurface, item: DecoratedItem) {
  return surface.itemViews.find((v) => v in item.variants);
}

export function findConfig(rules: Rules, numPlayers: number) {
  return rules.configs.find(
    ({ when }) => numPlayers >= when.minPlayers && numPlayers <= (when.maxPlayers ?? Infinity),
  );
}

export function findGameConfig(game: GameState) {
  return findConfig(game.rules, Object.keys(game.players.value).length);
}

type Deps = Pick<GameState & RoundState, 'rules' | 'seed' | 'players' | 'actions'>;

function calculateSurfaces({ seed, rules, actions, players }: Deps) {
  const random = new Random(seed);
  const config = findConfig(rules, Object.keys(players.value).length);

  if (!config) {
    throw new Error('no matching config');
  }

  const expandRepeat = (repeat?: Repetition): (Repeated | undefined)[] => {
    if (!repeat) {
      return [undefined];
    } else if ('forEach' in repeat) {
      if (repeat.forEach !== ForEach.PLAYER) {
        throw new Error('unsupported ForEach');
      }

      // todo: players is not ordered
      return Array(repeat.times ?? 1).fill(0).flatMap(
        () => Object.keys(players.value).map((value, index) => ({ value, index })),
      );
    }
    return Array(repeat.times).fill(0).map((_, i) => ({ value: i, index: i }));
  };

  const expand = <T>(list: RepeatValue<T>[]): RepeatedValue<T>[] =>
    list.flatMap(({ repeat, ...props }) =>
      expandRepeat(repeat).map((repeated) => ({ repeated, ...props as T }))
    );

  const surfaces = expand(config.surfaces ?? [])
    .map<DecoratedSurface>(({ repeated, ...props }) => ({
      ...props,
      repeated,
      id: random.nextGid(),
      items: [],
    }));

  for (const collection of config.collections ?? []) {
    const items = expand(collection.deck.items)
      .map<DecoratedItem>(({ repeated, ...props }) => ({
        ...props,
        repeated,
        id: random.nextGid(),
        variantIndex: 0,
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

  const surfaceById = toIdMap(surfaces);

  for (const { transaction } of actions.value) {
    if (!transaction) {
      continue;
    }
    const from = surfaceById[transaction.from];
    const to = surfaceById[transaction.to];
    const itemIndex = from.items.findIndex((item) => item.id === transaction.item);
    if (itemIndex < 0) {
      continue;
    }
    const [item] = from.items.splice(itemIndex, 1);

    // todo: validation:
    // 1. can this item be on this surface?
    // 2. can the variant be on this surface?

    to.items.push(item);
  }

  return surfaceById;
}

export function getSurfaces(group: GroupState) {
  const { game, round } = currentRound(group);
  return game && round && calculateSurfaces({ ...game, ...round });
}

type WithItems = { items: DecoratedItem[] };

export function getItems(surfaces: Record<string, WithItems>) {
  return toIdMap(Object.values(surfaces).flatMap((s) => s.items));
}

function toLocalSurface(
  { itemViews: surfaceItemViews, ...surface }: DecoratedSurface,
  userId: string,
): DecoratedLocalSurface {
  const isLocal = surface.repeated?.value === userId;
  const isPrivate = isLocal && surfaceItemViews.local !== undefined;
  const itemViews = (isLocal ? surfaceItemViews.local : undefined) ?? surfaceItemViews.default;
  return { isLocal, isPrivate, itemViews, ...surface };
}

export function getLocalSurfaces(group: GroupState, userId: string) {
  const surfaces = getSurfaces(group);
  return surfaces && mapValues(surfaces, (s) => toLocalSurface(s, userId));
}

export function decorateTransaction<S extends WithItems>(
  surfaces: Record<string, S>,
  t: Transaction,
) {
  const items = getItems(surfaces);

  const from = surfaces[t.from];
  const to = surfaces[t.to];
  const item = items[t.item];

  return { from, to, item };
}
