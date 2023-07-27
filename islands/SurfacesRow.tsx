// import useGame from '../utils/use_game.ts';
// import {
//   DecoratedItem,
//   DecoratedLocalSurface,
//   DecoratedSurface,
//   WireState,
// } from '../utils/game_engine.ts';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { JSX } from 'preact';
import { tw } from 'twind';
import { ChevronLeftIcon, ChevronRightIcon } from '../utils/icons/24/outline.ts';
import globalSelection from '../signals/selection.ts';
import { Placement } from '../utils/rules.ts';
import groupBy from '../utils/group_by.ts';
import SurfaceGroup from '../components/SurfaceGroup.tsx';
import { AuthState } from '../utils/auth_state.ts';
import { DecoratedItem, DecoratedLocalSurface, DecoratedSurface } from '../utils/rules_v2.ts';
import toIdMap from '../utils/id_map.ts';
import {
  DecoratedGame,
  DecoratedGroup,
  GroupAction,
  Round,
  RoundRef,
  WithRef,
} from '../utils/model_v2.ts';
import { currentRound, getItems, getLocalSurfaces, viewForItem } from '../utils/game_engine_v2.ts';
import { addTransaction } from '../utils/loading_v2.ts';
import { useGroupState } from '../utils/state_v2.ts';
import { RowType } from '../utils/row_type.ts';

type Surface = DecoratedLocalSurface;

// SideArrow.tsx

interface SideArrowProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  visible: boolean;
  resetScroll: () => void;
}

function SideArrow({ visible, resetScroll, children }: SideArrowProps) {
  const cls = 'w-10 border-none focus:outline-none transition duration-500';
  const opacityCls = `opacity-${visible ? 100 : 0}`;
  return <button class={tw(cls, opacityCls)} onClick={resetScroll}>{children}</button>;
}

//

interface Props extends AuthState {
  type: RowType;
  groupData: DecoratedGroup;
}

const ROW_PLACEMENT = {
  [RowType.TOP]: [Placement.BACK, Placement.FRONT],
  [RowType.CENTER]: [Placement.CENTER],
  [RowType.BOTTOM]: [Placement.FRONT, Placement.BACK],
};

export default function SurfacesRow({ type, authUser, groupData }: Props) {
  const group = useGroupState(groupData);

  const { game, round } = currentRound(group);
  const surfacesById = getLocalSurfaces(group, authUser.id);

  if (!game || !round || !surfacesById) {
    return null;
  }
  const itemById = getItems(surfacesById);

  // Calculate surfaces
  const showLocal = type === RowType.BOTTOM;

  const getPlacement = (s: DecoratedLocalSurface) =>
    s.placement ?? s.repeated ? Placement.FRONT : Placement.CENTER;

  const surfaces = Object.entries(groupBy(
    Object.values(surfacesById).filter((s) =>
      ROW_PLACEMENT[type].includes(getPlacement(s)) && s.isLocal === showLocal
    ),
    (s) => s.repeated?.value ?? s.id,
  ));

  const prio = ({ placement }: Surface) => placement ? ROW_PLACEMENT[type].indexOf(placement) : 0;
  surfaces.forEach(([_, surface]) => surface.sort((lhs, rhs) => prio(lhs) - prio(rhs)));

  // UI state
  const [resetTimer, setResetTimer] = useState<number>();
  const [scrollState, setScrollState] = useState<{ start: number; drag?: number }>({ start: 0 });
  const [activeTouch, setActiveTouch] = useState<{ id: number; x: number; y: number }>();
  const resetScroll = () => setScrollState({ start: 0 });

  //  Ensure reset timer clears on dismount
  useEffect(() => () => clearTimeout(resetTimer));

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
        setScrollState({ ...scrollState, drag });
        break;
      }
    }
  };
  const onTouchEnd = (e: JSX.TargetedTouchEvent<EventTarget>) => {
    setActiveTouch(undefined);
    clearTimeout(resetTimer);
    setScrollState({ start: scrollState.start + (scrollState.drag ?? 0) });
    setResetTimer(setTimeout(resetScroll, 1000));
  };
  const touchHandlers = { onTouchStart, onTouchMove, onTouchEnd };

  // Item selection logic

  const onItemSelect = async (surface: Surface, item: DecoratedItem | null) => {
    const prevSelection = globalSelection.value;
    if (prevSelection && surface.id !== prevSelection.surface) {
      resetScroll();
      globalSelection.value = undefined;

      const { item } = prevSelection;

      // todo: ensure move-to is ok (check any/all itemViews)
      if (!viewForItem(surface, itemById[item])) {
        console.warn('not movable');
        return;
      }

      await addTransaction(round.ref, {
        userid: authUser.id,
        from: prevSelection.surface,
        to: surface.id,
        item,
      });
    } else {
      if (!item) {
        resetScroll();
      }
      globalSelection.value = !item || item.id === prevSelection?.item
        ? undefined
        : { surface: surface.id, item: item.id };
    }
  };

  const offset = scrollState.start + (scrollState.drag ?? 0);

  // Classes & styles

  const rowCls = tw`flex(&) my-2 transition duration-[${offset ? 50 : 500}ms]`;
  const transform = `translateX(${offset}px)`;

  const resetSelection = () => globalSelection.value = undefined;

  return (
    <div class={rowCls} style={{ transform }} {...touchHandlers} onClick={resetSelection}>
      <SideArrow visible={offset > 0} {...{ resetScroll }}>
        <ChevronLeftIcon />
      </SideArrow>

      <div class={tw(`flex w-max max-h-full items-center`)}>
        {surfaces.map(([userid, surfaces]) => (
          <SurfaceGroup
            profile={group.profiles.value[userid]}
            {...{ surfaces, onItemSelect }}
          />
        ))}
      </div>

      <SideArrow visible={offset < 0} {...{ resetScroll }}>
        <ChevronRightIcon />
      </SideArrow>
    </div>
  );
}
