export type Class = string;
export type Value = string | number;
export type Metadata = Record<string, unknown>;
export type Variants = Record<Class, { value?: Value; metadata?: Metadata }>;

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

export interface Item {
  metadata?: Metadata;
  variants: Variants;
}

export interface Deck {
  items: RepeatValue<Item>[];
}

export interface Distribution {
  surfaceClass: Class;
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
  SHOW_NONE,
  SHOW_NUM,
}

export interface Surface {
  class: Class;
  type: SurfaceType;
  itemViews: { local?: Class; log?: Class; default: Class };
}

//  Config

export interface ConfigCondition {
  maxPlayers: number;
}

export interface Config {
  when?: ConfigCondition;
  collections?: Collection[];
  surfaces?: RepeatValue<Surface>[];
}

export interface Rules {
  configs: Config[];
}

// ================== Love letter implementation ==================

const makeCard = (name: string, value: number, repeat?: Repetition): RepeatValue<Item> => ({
  repeat,
  metadata: { name: 'Card' },
  variants: {
    front: { value, metadata: { name, image: `/cards/${name.toLowerCase()}.jpg` } },
    back: { metadata: { image: '/back.jpg' } },
  },
});

const TURN_INDICATOR: Deck = { items: [{ variants: { turn: {} } }] };

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

const LOVE_LETTER: Rules = {
  configs: [
    {
      when: { maxPlayers: 2 },
      collections: [
        { deck: TURN_INDICATOR, distributions: [{ surfaceClass: 'turn' }] },
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
          type: SurfaceType.SHOW_ALL,
          itemViews: { default: 'back' },
        },
        {
          class: 'init-3',
          type: SurfaceType.SHOW_ALL,
          itemViews: { default: 'front' },
        },
        {
          class: 'pile',
          type: SurfaceType.SHOW_TOP,
          itemViews: { default: 'back' },
        },
        {
          repeat: { forEach: ForEach.PLAYER },
          class: 'turn',
          type: SurfaceType.SHOW_ALL,
          itemViews: { default: 'turn' },
        },
        {
          repeat: { forEach: ForEach.PLAYER },
          class: 'discard',
          type: SurfaceType.SHOW_ALL,
          itemViews: { default: 'front' },
        },
        {
          repeat: { forEach: ForEach.PLAYER },
          class: 'hand',
          type: SurfaceType.SHOW_ALL,
          itemViews: { local: 'front', default: 'back' },
        },
      ],
    },
  ],
};

export const RULES_DB: Record<string, Rules> = {
  ['loveletter']: LOVE_LETTER,
};
