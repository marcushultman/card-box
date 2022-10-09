import { JSX } from 'preact';
import { tw } from 'twind';
import { SurfaceType } from '../utils/rules.ts';
import { DecoratedItem, DecoratedLocalSurface, DecoratedSurface } from '../utils/game_engine.ts';
import { DraggableCard, DraggableTurn } from './Draggable.tsx';
import { ReadonlySignal } from '@preact/signals';
import { Square3Stack3DIcon } from 'https://esm.sh/@heroicons/react@2.0.11/24/outline?alias=react:preact/compat';

type Surface = DecoratedLocalSurface | DecoratedSurface;

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  surface: Surface;
  textBottom?: boolean;
  selectedItem: ReadonlySignal<string | undefined>;
  onItemSelect?: (surface: Surface, item: DecoratedItem | null) => void;
}

export default function SurfaceView(
  { surface, textBottom, selectedItem, onItemSelect, class: cls, ...props }: Props,
) {
  if (surface.type === SurfaceType.SHOW_NONE) {
    return null;
  }

  const emptyCls = tw`italic w-24 h-32 rounded-lg flex(& col) items-center justify-center`;
  const emptyShadow = '2px 4px 8px rgba(0, 0, 0, 0.6)';
  const emptyStyle = { textShadow: emptyShadow };
  const emptyIconCls = tw`w-12`;
  const emptyIconStyle = { filter: `drop-shadow(${emptyShadow})` };

  const renderItem = (item: DecoratedItem, cls?: string) => {
    // todo: this is admin specific logic
    let itemView = 'itemView' in surface
      ? surface.itemView
      : surface.itemViews.local ?? surface.itemViews.default;

    // todo: fallback to first item variant
    if (!(itemView in item.variants)) {
      itemView = Object.keys(item.variants)[0];
    }

    const { metadata } = item.variants[itemView];

    if (itemView === 'turn') {
      return (
        <DraggableTurn
          metadata={metadata}
          onClick={(e) => (e.stopPropagation(), onItemSelect?.(surface, item))}
        />
      );
    } else if (itemView === 'back' || itemView === 'front') {
      const shadowColor = selectedItem.value === item.id
        ? 'rgba(255, 255, 0, .2)'
        : 'rgba(0, 0, 0, .6)';
      return (
        <DraggableCard
          class={cls}
          invisible={false}
          metadata={metadata}
          onClick={(e) => (e.stopPropagation(), onItemSelect?.(surface, item))}
          style={{
            'box-shadow': `0 4px 32px ${shadowColor}`,
          }}
        />
      );
    }
    throw new Error(`missing view implementation for class '${itemView}'`);
  };

  const renderEmpty = () => (
    <div class={emptyCls} style={emptyStyle}>
      <Square3Stack3DIcon className={emptyIconCls} style={emptyIconStyle} />
      <span>Empty</span>
    </div>
  );

  const renderItems = () => {
    switch (surface.type) {
      case SurfaceType.SHOW_ALL_EXPANDED:
        return surface.items.length
          ? (
            <div class='flex'>
              {surface.items.map((item) => renderItem(item))}
            </div>
          )
          : renderEmpty();
      case SurfaceType.SHOW_ALL:
        return surface.items.length
          ? (
            <div class={`flex relative w-[${2 * (surface.items.length - 1) + 6}rem] h-32`}>
              {surface.items.map((item, i) =>
                renderItem(item, tw(`absolute top-0 left-[${2 * i}rem]`))
              )}
            </div>
          )
          : renderEmpty();
      case SurfaceType.SHOW_NUM:
        return <div class='font-bold'>{surface.items.length}</div>;
      case SurfaceType.SHOW_TOP:
        return (
          <div class='flex items-center'>
            <span class='mr-2'>{surface.items.length}x</span>
            {surface.items.slice(-1).map((item) => renderItem(item))}
          </div>
        );
    }
    throw new Error('Unknown SurfaceType');
  };

  const onSurfaceSelect = () => onItemSelect?.(surface, null);

  return (
    <div class={tw('text-center flex(& col)', cls)} onClick={onSurfaceSelect} {...props}>
      {renderItems()}
    </div>
  );
}
