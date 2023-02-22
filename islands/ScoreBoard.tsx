import { useComputed } from '@preact/signals';
import { PlayerWidgets } from '../components/PlayerWidgets.tsx';
import { findGameConfig } from '../utils/game_engine_v2.ts';
import { DecoratedGroup } from '../utils/model_v2.ts';
import { useGroupState } from '../utils/state_v2.ts';

interface Props {
  groupData: DecoratedGroup;
}

export default function ScoreBoard({ groupData }: Props) {
  const group = useGroupState(groupData, []);

  const game = useComputed(() => group.games.value.at(-1));
  const config = game.value && findGameConfig(game.value);

  if (!game.value || !config) {
    throw new Error();
  }

  const ref = game.value.ref;

  const scores = Object.entries(game.value.players.value);
  scores.sort((lhs, rhs) => {
    const diff = rhs[1].points.value - lhs[1].points.value;
    return diff !== 0
      ? diff
      : group.profiles.value[lhs[0]].name.localeCompare(group.profiles.value[rhs[0]].name);
  });

  return (
    <div class='px-4'>
      {scores.flatMap(([id, state], i) => [
        <div class='flex my-2 px-4'>
          <div class='flex-1'>{i + 1}. {group.profiles.value[id].name}</div>
          <PlayerWidgets gameRef={ref} config={config} playerId={id} player={state} />
        </div>,
        <hr />,
      ])}
    </div>
  );
}
