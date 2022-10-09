import useGame from '../utils/use_game.ts';
import {
  calculateLocalState,
  calculateSurfaces,
  DecoratedItem,
  DecoratedLocalSurface,
  DecoratedSurface,
  Game,
} from '../utils/game_engine.ts';
import { useEffect, useState } from 'preact/hooks';
import { JSX } from 'preact';
import { computed, signal } from '@preact/signals';
import { tw } from 'twind';
import SurfaceView from '../components/SurfaceView.tsx';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'https://esm.sh/@heroicons/react@2.0.11/24/outline?alias=react:preact/compat';
import { IS_BROWSER } from '$fresh/runtime.ts';

type Surface = DecoratedLocalSurface | DecoratedSurface;

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  userid: string;
  gameId: string;
  game: Game;
  surfaces: string[];
  rotationX?: number;
  textBottom?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const globallySelection = signal<{ surface?: string; item?: string }>({});

export default function SurfacesArea(
  {
    userid,
    gameId,
    game: initGame,
    surfaces: surfaceIds,
    rotationX,
    textBottom,
    class: cls,
    ...props
  }: Props,
) {
  const { game, addAction } = useGame(gameId, initGame);

  // Calculate surfaces
  const { surfaceById } = calculateLocalState(game, userid);

  const surfaces = surfaceIds.map((id) => surfaceById[id]);

  // UI state
  const [resetTimer, setResetTimer] = useState<number>();
  const [offset, setOffset] = useState<{ start: number; drag?: number }>({ start: 0 });
  const [activeTouch, setActiveTouch] = useState<{ id: number; x: number; y: number }>();

  // Touch handling
  const onTouchStart = (e: JSX.TargetedTouchEvent<EventTarget>) => {
    clearTimeout(resetTimer);
    const touch = e.changedTouches.item(0);
    if (touch) {
      const { identifier: id, clientX: x, clientY: y } = touch;
      setActiveTouch({ id, x: x, y });
    }
  };
  const onTouchMove = (e: JSX.TargetedTouchEvent<EventTarget>) => {
    for (let i = 0; activeTouch && i < e.changedTouches.length; ++i) {
      const touch = e.changedTouches.item(i)!;
      if (touch.identifier === activeTouch.id) {
        const drag = touch.clientX - activeTouch.x;
        setOffset({ ...offset, drag });
      }
    }
  };
  const onTouchEnd = () => {
    setActiveTouch(undefined);
    clearTimeout(resetTimer);
    setOffset({ start: offset.start + (offset.drag ?? 0) });
    setResetTimer(setTimeout(() => setOffset({ start: 0 }), 5000));
  };

  const touchHandlers = { onTouchStart, onTouchMove, onTouchEnd };

  // Item selection logic

  const onItemSelect = async (surface: Surface, item: DecoratedItem | null) => {
    const selection = { ...globallySelection.value };

    if (surface.id !== selection.surface && selection.surface && selection.item) {
      setOffset({ start: 0 });
      globallySelection.value = {};
      await addAction({ userid, from: selection.surface, to: surface.id, item: selection.item });
    } else {
      if (!item) {
        setOffset({ start: 0 });
      }
      if (item?.id === selection.item) {
        globallySelection.value = {};
      } else {
        globallySelection.value = { surface: surface.id, item: item?.id };
      }
    }
  };

  const selectedItem = computed(() => globallySelection.value.item);

  // Classes & styles
  const containerCls = tw(
    'w-max flex transition origin-bottom p-2 bg-[#404b5eaa] rounded-xl',
    offset ? 'duration-[50ms]' : 'duration-[1000ms]',
    cls,
  );

  // todo: make rotateY non-linear
  const totalOffset = clamp(
    offset.start + (offset.drag ?? 0),
    IS_BROWSER ? -innerWidth / 2 : 0,
    IS_BROWSER ? innerWidth / 2 : 0,
  );
  // rotateY(${clamp(-totalOffset / 30, -3, 3)}deg)
  const transform = `
    translateX(${totalOffset}px)
    rotateX(${rotationX ?? 35}deg)
    rotateZ(${totalOffset / 100}deg)
  `;

  const containerStyle = { transform };
  const surfaceViewProps = { textBottom, onItemSelect, selectedItem };

  const sideArrow = (visible: boolean, child: JSX.Element) => (
    <button
      class={tw(
        'border-none focus:outline-none transition duration-500',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      onClick={() => setOffset({ start: 0 })}
    >
      {Object.assign(child, { props: { className: 'w-10' } })}
    </button>
  );

  return (
    <div class={containerCls} style={containerStyle} {...touchHandlers} {...props}>
      {sideArrow(totalOffset > 0, <ChevronLeftIcon />)}
      <div class='flex(& wrap) justify-center'>
        {surfaces.map((surface) => (
          <SurfaceView
            class='mx-4'
            {...surfaceViewProps}
            {...{ surface }}
          />
        ))}
      </div>
      {sideArrow(totalOffset < 0, <ChevronRightIcon />)}
    </div>
  );
}
