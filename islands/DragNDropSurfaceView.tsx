import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { SurfaceType } from '../utils/rules.ts';
import {
  calculateSurfaces,
  DecoratedItem,
  DecoratedLocalSurface,
  DecoratedSurface,
  Game,
} from '../utils/game_engine.ts';
import { DraggableCard, DraggableTurn } from '../components/Draggable.tsx';
import useGame from '../utils/use_game.ts';
import { IS_BROWSER } from '$fresh/runtime.ts';
import { assert } from 'https://deno.land/std@0.152.0/testing/asserts.ts';

interface Props {
  userid: string;
  gameId: string;
  game: Game;
  surface: DecoratedLocalSurface | DecoratedSurface;
}

interface Drag {
  surfaceId: string;
  itemId: string;
}

const imagePromise = new Promise<HTMLImageElement>((onload) => {
  if (!IS_BROWSER) {
    return;
  }
  const image = new Image();
  image.onload = () => onload(image);
  image.src = '/back.jpg';
});

export default function SurfaceView(
  { userid, gameId, game: initGame, surface: serverSurface }: Props,
) {
  const surfaceId = serverSurface.id;
  const [surface, setSurface] = useState(serverSurface);
  const [hidden, setHidden] = useState<string[]>([]);
  const { game, addAction } = useGame(gameId, initGame);

  //  Load surface
  useEffect(() => {
    game && setSurface(calculateSurfaces(game).surfaceById[surfaceId]);
  }, [game]);

  // UI

  function onDragStart(
    e: h.JSX.TargetedDragEvent<HTMLElement>,
    itemId: string,
    img?: Promise<HTMLImageElement>,
  ) {
    const drag: Drag = { surfaceId, itemId };
    const dataTransfer = (assert(e.dataTransfer), e.dataTransfer);
    dataTransfer.setData('application/drag', JSON.stringify(drag));
    img?.then((img) => dataTransfer.setDragImage(img, 199, 278));
    dataTransfer.effectAllowed = 'move';
    dataTransfer.dropEffect = 'move';
    setHidden([...hidden, itemId]);
  }
  function onDragEnd(e: h.JSX.TargetedDragEvent<HTMLElement>) {
    setHidden([]);
  }

  function onDragOver(e: h.JSX.TargetedDragEvent<HTMLElement>) {
    e.preventDefault();
    assert(e.dataTransfer);
    e.dataTransfer.dropEffect = 'move';
  }

  function onDrop(e: h.JSX.TargetedDragEvent<HTMLElement>) {
    assert(e.dataTransfer);
    const { surfaceId, itemId } = JSON.parse(e.dataTransfer.getData('application/drag')) as Drag;
    if (surface.id !== surfaceId) {
      addAction({ userid, from: surfaceId, to: surface.id, item: itemId });
    }
  }

  const renderItem = (item: DecoratedItem) => {
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
          invisible={hidden.includes(item.id)}
          metadata={metadata}
          draggable
          onDragStart={(e) => onDragStart(e, item.id)}
          onDragEnd={onDragEnd}
        />
      );
    } else if (itemView === 'back' || itemView === 'front') {
      return (
        <DraggableCard
          invisible={hidden.includes(item.id)}
          metadata={metadata}
          draggable
          onDragStart={(e) => onDragStart(e, item.id, imagePromise)}
          onDragEnd={onDragEnd}
        />
      );
    }
    throw new Error(`missing view implementation for class '${itemView}'`);
  };

  const renderItems = () => {
    switch (surface.type) {
      case SurfaceType.SHOW_ALL:
        return surface.items.map((item) => renderItem(item));
      case SurfaceType.SHOW_NUM:
        return <div class='font-bold'>{surface.items.length}</div>;
      case SurfaceType.SHOW_TOP:
        return surface.items.slice(-1).map((item) => renderItem(item));
    }
  };

  if (surface.type === SurfaceType.SHOW_NONE) {
    return null;
  }

  // const numItems = surface.items.length;
  // const w = numItems && surface.type === SurfaceType.SHOW_ALL ? `w-[${12 * numItems}rem]` : 'w-48';

  const items = renderItems();

  return (
    <div
      class='m-2 p-4 rounded-lg bg-coolGray-500 text-center flex(& col)'
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <h3 class='font-bold'>
        {surface.repeated?.value} {surface.class}
        {surface.type === SurfaceType.SHOW_TOP ? ` (${surface.items.length})` : ''}
      </h3>
      {Array.isArray(items) && !items.length
        ? <div class='italic'>Empty</div>
        : <div class='flex-1 justify-evenly flex(& wrap)'>{items}</div>}
    </div>
  );
}
