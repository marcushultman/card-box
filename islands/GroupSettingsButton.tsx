import { tw } from 'twind';
import { JSX } from 'preact';
import { useComputed } from '@preact/signals';
import { findGameConfig } from '../utils/game_engine_v2.ts';
import { DecoratedGroup } from '../utils/model_v2.ts';
import { addRound, useGroupState } from '../utils/state_v2.ts';

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  groupData: DecoratedGroup;
}

export default function GroupSettingsButton({ groupData, class: cls }: Props) {
  const group = useGroupState(groupData, []);

  const game = useComputed(() => group.games.value.at(-1));

  if (!game.value) {
    throw new Error();
  }

  const hejCls = 'px-6 py-4 rounded-2xl text-white bg-coolGray-500';

  return (
    <div class={tw('px-4 flex justify-center gap-2', cls)}>
      <button class={hejCls} onClick={() => game.value && addRound(game.value)}>New round</button>
    </div>
  );
}
