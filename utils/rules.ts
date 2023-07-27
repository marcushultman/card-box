export type ItemClass = string;
export type SurfaceClass = string;
export type Value = string | number;

export interface Variant {
  image: string;
  value?: Value;
  name?: string;
}

export enum ForEach {
  PLAYER,
}

// Repeat

export interface Repetition {
  forEach?: ForEach;
  times?: number;
}

export type RepeatValue<T> = { repeat?: Repetition } & T;

// Item

export type Variants = Record<ItemClass, Variant>;

export interface Item {
  name: string;
  variants: Variants;
}

export interface Deck {
  items: RepeatValue<Item>[];
}

export interface Distribution {
  surfaceClass: SurfaceClass;
}

export interface Collection {
  deck: Deck;
  distributions?: RepeatValue<Distribution>[];
  shuffle?: boolean;
}

// Surface

export enum SurfaceType {
  SHOW_TOP,
  SHOW_ALL,
  SHOW_ALL_EXPANDED,
  SHOW_NONE,
  SHOW_NUM,
}

export enum Placement {
  CENTER,
  FRONT,
  BACK,
}

export interface Surface {
  class: SurfaceClass;
  type: SurfaceType;
  itemViews: {
    local?: ItemClass[];
    logTo?: ItemClass[];
    logFrom?: ItemClass[];
    log?: ItemClass[];
    default: ItemClass[];
  };
  placement?: Placement;
  log?: { from?: boolean; to?: boolean };
  actions?: { promptShow?: boolean };
}

//  Config

export interface ConfigCondition {
  minPlayers: number;
  maxPlayers?: number;
}

export enum WidgetType {
  POINT_COUNTER,
}

export interface PlayerWidgetConfig {
  type: WidgetType;
}

export interface Config {
  when: ConfigCondition;
  collections?: Collection[];
  surfaces?: RepeatValue<Surface>[];
  playerWidgets?: PlayerWidgetConfig[];
}

export interface Rules {
  name: string;
  configs: Config[];
}

// ================== Love letter implementation ==================

const makeCard = (name: string, value: number, repeat?: Repetition): RepeatValue<Item> => ({
  repeat,
  name: 'Card',
  variants: {
    front: { value, name, image: `/cards/${name.toLowerCase()}.jpg` },
    back: { image: '/back.jpg' },
  },
});

const LOVE_LETTER_DECK: Deck = {
  items: [
    makeCard('Guard', 1, { times: 5 }),
    makeCard('Priest', 2, { times: 2 }),
    makeCard('Baron', 3, { times: 2 }),
    makeCard('Handmaid', 4, { times: 2 }),
    makeCard('Prince', 5, { times: 2 }),
    makeCard('King', 6),
    makeCard('Countess', 7),
    makeCard('Princess', 8),
  ],
};

export const DECK_DB: Record<string, Deck> = {
  ['loveletter']: LOVE_LETTER_DECK,
};

const LOVE_LETTER: Rules = {
  name: 'Love Letter',
  configs: [
    {
      when: { minPlayers: 2, maxPlayers: 2 },
      collections: [
        {
          deck: LOVE_LETTER_DECK,
          shuffle: true,
          distributions: [
            { surfaceClass: 'init-1', repeat: { times: 1 } },
            { surfaceClass: 'init-3', repeat: { times: 3 } },
            { surfaceClass: 'hand', repeat: { forEach: ForEach.PLAYER } },
            { surfaceClass: 'pile' },
          ],
        },
      ],
      surfaces: [
        {
          class: 'init-1',
          type: SurfaceType.SHOW_ALL_EXPANDED,
          itemViews: { default: ['back'] },
        },
        {
          class: 'init-3',
          type: SurfaceType.SHOW_ALL,
          itemViews: { default: ['front'] },
        },
        {
          class: 'pile',
          type: SurfaceType.SHOW_TOP,
          itemViews: { default: ['back'] },
        },
        {
          repeat: { forEach: ForEach.PLAYER },
          class: 'hand',
          type: SurfaceType.SHOW_ALL,
          itemViews: { local: ['front'], default: ['back'] },
          placement: Placement.BACK,
          actions: { promptShow: true },
          log: { from: true },
        },
        {
          repeat: { forEach: ForEach.PLAYER },
          class: 'discard',
          type: SurfaceType.SHOW_ALL,
          itemViews: { default: ['front'] },
          log: { to: true },
        },
      ],
      playerWidgets: [
        {
          type: WidgetType.POINT_COUNTER,
        },
      ],
    },
  ],
};

export const RULES_DB: Record<string, Rules> = {
  ['loveletter']: LOVE_LETTER,
};
