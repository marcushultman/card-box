import { tw } from 'twind';
import { JSX } from 'preact';
import { useComputed } from '@preact/signals';
import { DecoratedGroup } from '../utils/model_v2.ts';
import { addRound, useGroupState } from '../utils/state_v2.ts';

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  groupData: DecoratedGroup;
}

export default function GroupSettingsButton({ groupData, class: cls }: Props) {
  const group = useGroupState(groupData, []);
  const game = useComputed(() => group.games.value.at(-1)!);

  const btnCls = 'px-4 py-2 rounded-full bg-green-200';

  return (
    <div class={tw('px-4 flex justify-center gap-2', cls)}>
      <button class={btnCls} onClick={() => addRound(game.value)}>Next round</button>
    </div>
  );
}
