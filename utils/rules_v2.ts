import { Item, ItemClass, Surface, Value } from './rules.ts';

export interface Repeated {
  index: number;
  value: Value;
}

export type RepeatedValue<T> = { repeated?: Repeated } & T;

export interface DecoratedItem extends RepeatedValue<Item> {
  id: string;
  variantIndex: number;
}

export interface DecoratedSurface extends RepeatedValue<Surface> {
  id: string;
  items: DecoratedItem[];
}

export interface LocalSurface extends Omit<Surface, 'itemViews'> {
  isLocal: boolean;
  itemViews: ItemClass[];
}

export interface DecoratedLocalSurface extends RepeatedValue<LocalSurface> {
  id: string;
  items: DecoratedItem[];
}
