import { JSX } from 'preact';
import { tw } from 'twind';
import { SurfaceType } from '../utils/rules.ts';
import { Card } from './Card.tsx';
import { ReadonlySignal } from '@preact/signals';
import { EyeIcon, Square3Stack3DIcon } from '../utils/icons/24/outline.ts';
import { DecoratedItem, DecoratedLocalSurface, DecoratedSurface } from '../utils/rules_v2.ts';
import { viewForItem } from '../utils/game_engine_v2.ts';

type Surface = DecoratedLocalSurface;

interface Props {
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

  const renderItem = (item: DecoratedItem, cls?: string) => {
    const itemView = viewForItem(surface, item);
    const isSelected = selectedItem.value === item.id;

    if (itemView === 'back' || itemView === 'front') {
      const transform = isSelected ? 'translateY(-4px)' : undefined;
      const shadowColor = isSelected ? 'rgba(255, 255, 128, .5)' : 'rgba(0, 0, 0, .5)';
      return (
        <Card
          class={tw(cls, isSelected && 'brightness-125 filter')}
          variant={item.variants[itemView]}
          onClick={(e) => onItemSelect(e, item)}
          style={{ transform, 'box-shadow': `0 4px 32px ${shadowColor}` }}
        />
      );
    }
    throw new Error(`missing view implementation for class '${itemView}'`);
  };

  const renderEmpty = () => (
    <div class={emptyCls} style={emptyStyle} onClick={onSurfaceSelect}>
      <Square3Stack3DIcon className={emptyIconCls} style={emptyIconStyle} />
      <span>Empty</span>
    </div>
  );

  const showAllCls = `flex relative w-[${2 * (surface.items.length - 1) + 5}rem] h-28`;

  switch (surface.type) {
    case SurfaceType.SHOW_ALL_EXPANDED:
      return surface.items.length
        ? (
          <div class='flex' onClick={onSurfaceSelect}>
            {surface.items.map((item) => renderItem(item, 'mx-1'))}
          </div>
        )
        : renderEmpty();
    case SurfaceType.SHOW_ALL:
      return surface.items.length
        ? (
          <div
            class={surface.isPrivate ? 'relative border(& gray-400 dashed) rounded p-2' : ''}
          >
            <div class={showAllCls} onClick={onSurfaceSelect}>
              {surface.items.map((item, i) =>
                renderItem(item, tw(`absolute top-0 left-[${2 * i}rem]`))
              )}
            </div>
          </div>
        )
        : renderEmpty();
    case SurfaceType.SHOW_NUM:
      return <div class='font-bold' onClick={onSurfaceSelect}>{surface.items.length}</div>;
    case SurfaceType.SHOW_TOP:
      return (
        <div class='flex items-center' onClick={onSurfaceSelect}>
          <span class='mr-2'>{surface.items.length}x</span>
          {surface.items.slice(-1).map((item) => renderItem(item))}
        </div>
      );
  }
}
