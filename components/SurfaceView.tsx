import { JSX } from 'preact';
import { tw } from 'twind';
import { SurfaceType } from '../utils/rules.ts';
import { Card } from './Card.tsx';
import { ReadonlySignal } from '@preact/signals';
import { Square3Stack3DIcon } from '../utils/icons/24/outline.ts';
import { DecoratedItem, DecoratedLocalSurface, DecoratedSurface } from '../utils/rules_v2.ts';
import { viewForItem } from '../utils/game_engine_v2.ts';

type Surface = DecoratedLocalSurface;

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  surface: Surface;
  selectedItem: ReadonlySignal<string | undefined>;
  onItemSelect?: (surface: Surface, item: DecoratedItem | null) => void;
}

export default function SurfaceView({ surface, selectedItem, onItemSelect: onSelect }: Props) {
  if (surface.type === SurfaceType.SHOW_NONE) {
    return null;
  }

  const emptyCls = tw`italic w-16 h-28 m-auto rounded-lg flex(& col) items-center justify-center`;
  const emptyShadow = '2px 4px 8px rgba(0, 0, 0, 0.6)';
  const emptyStyle = { textShadow: emptyShadow };
  const emptyIconCls = tw`w-12`;
  const emptyIconStyle = { filter: `drop-shadow(${emptyShadow})` };

  const onSurfaceSelect = () => onSelect?.(surface, null);
  const onItemSelect = (e: JSX.TargetedMouseEvent<EventTarget>, item: DecoratedItem) => {
    e.stopPropagation();
    onSelect?.(surface, item);
  };

  const props = { onClick: onSurfaceSelect };

  const renderItem = (item: DecoratedItem, cls?: string) => {
    const itemView = viewForItem(surface, item);

    if (itemView === 'back' || itemView === 'front') {
      const transform = selectedItem.value === item.id ? 'translateY(-4px)' : undefined;
      const shadowColor = selectedItem.value === item.id
        ? 'rgba(255, 255, 128, .5)'
        : 'rgba(0, 0, 0, .5)';
      return (
        <Card
          class={tw(cls, selectedItem.value === item.id && 'brightness-125 filter')}
          variant={item.variants[itemView]}
          onClick={(e) => onItemSelect(e, item)}
          style={{ transform, 'box-shadow': `0 4px 32px ${shadowColor}` }}
        />
      );
    }
    throw new Error(`missing view implementation for class '${itemView}'`);
  };

  const renderEmpty = () => (
    <div class={emptyCls} style={emptyStyle} {...props}>
      <Square3Stack3DIcon className={emptyIconCls} style={emptyIconStyle} />
      <span>Empty</span>
    </div>
  );

  switch (surface.type) {
    case SurfaceType.SHOW_ALL_EXPANDED:
      return surface.items.length
        ? (
          <div class='flex' {...props}>
            {surface.items.map((item) => renderItem(item, 'mx-1'))}
          </div>
        )
        : renderEmpty();
    case SurfaceType.SHOW_ALL:
      return surface.items.length
        ? (
          <div
            class={`flex relative w-[${2 * (surface.items.length - 1) + 5}rem] h-28`}
            {...props}
          >
            {surface.items.map((item, i) =>
              renderItem(item, tw(`absolute top-0 left-[${2 * i}rem]`))
            )}
          </div>
        )
        : renderEmpty();
    case SurfaceType.SHOW_NUM:
      return <div class='font-bold' {...props}>{surface.items.length}</div>;
    case SurfaceType.SHOW_TOP:
      return (
        <div class='flex items-center' {...props}>
          <span class='mr-2'>{surface.items.length}x</span>
          {surface.items.slice(-1).map((item) => renderItem(item))}
        </div>
      );
  }
  throw new Error('Unknown SurfaceType');
}
