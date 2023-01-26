// import { DecoratedPlayer } from '../utils/game_engine.ts';
import { Config, WidgetType } from '../utils/rules.ts';
import { useSwipeable } from 'https://esm.sh/*react-swipeable@7.0.0?alias=react:preact/compat';
import { useState } from 'preact/hooks';
import { tw } from 'twind';
import {
  decrementPoints,
  GamePlayerState,
  incrementPoints,
  resetPoints,
} from '../utils/state_v2.ts';
import { GameRef } from '../utils/model_v2.ts';

interface Props {
  // can't use ref - probably for preact reasons
  gameRef: GameRef;
  config: Config;
  playerId: string;
  player: GamePlayerState;
}

const CLS = 'relative px-2 text-white bg(coolGray-700 opacity-75) rounded-full';

function PointCounter({ gameRef, playerId, player }: Props) {
  const points = player.points.value;

  const [prevPoints, setPrevPoints] = useState<number>();
  const [resetTimeout, setResetTimeout] = useState<number>();

  const prevPointsCls = tw(
    'absolute top-0 transition duration-500 transform',
    prevPoints ? 'translate-y-full' : null,
  );

  const handlers = useSwipeable({
    onSwipedRight: () => incrementPoints(gameRef, playerId, player),
    onSwipedUp: () => incrementPoints(gameRef, playerId, player),
    onSwipedLeft: () => decrementPoints(gameRef, playerId, player),
    onSwipedDown: () => {
      clearTimeout(resetTimeout);
      setPrevPoints(points);
      resetPoints(gameRef, playerId, player);
      setResetTimeout(setTimeout(() => setPrevPoints(undefined), 500));
    },
  });

  return (
    <div class={CLS} onClick={() => incrementPoints(gameRef, playerId, player)} {...handlers}>
      <div>{points}p</div>
      <div class={prevPointsCls}>{prevPoints ? `${prevPoints}p` : null}</div>
    </div>
  );
}

const COMP_MAP = {
  [WidgetType.POINT_COUNTER]: PointCounter,
};

export function PlayerWidgets(props: Props) {
  const widgets = props.config.playerWidgets?.map(({ type }) => COMP_MAP[type]);
  return (
    <div>
      <div>{widgets?.map((Widget) => <Widget {...props} />)}</div>
    </div>
  );
}
