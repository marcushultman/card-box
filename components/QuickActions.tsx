import { Signal } from '@preact/signals-core';
import { useSignal } from '@preact/signals';
import { tw } from 'twind';
import { currentRound, findConfig } from '../utils/game_engine_v2.ts';
import { PlayIcon, StopIcon } from '../utils/icons/24/outline.ts';
import { loadRules } from '../utils/loading_v2.ts';
import { addGame, endGame, GameState, GroupState } from '../utils/state_v2.ts';
import { Rules } from '../utils/rules.ts';
import { useEffect } from 'preact/hooks';
import { NinetyRing } from 'https://esm.sh/*react-svg-spinners@0.3.1?alias=react:preact/compat&cjs-exports=NinetyRing';

const maxHeightCls = (full: boolean) => full ? tw`max-h-full` : tw`max-h-0`;

function QuickActionButton(
  { title, color, icon: Icon, disabled, onSelect }: {
    title: string;
    color: string;
    icon: any;
    disabled?: boolean;
    onSelect?: () => void;
  },
) {
  const cls = 'text-white p-4 rounded-full';
  return (
    <div class='mb-2'>
      <button
        class={tw(cls, `bg-${color}-${disabled ? 300 : 500}`)}
        onClick={onSelect}
        disabled={disabled}
      >
        <Icon className={tw`w-10 h-10`} />
      </button>
      <div class='text-sm'>{title}</div>
    </div>
  );
}

export default function QuickActions({ group, visible }: {
  group: GroupState;
  visible: Signal<boolean>;
}) {
  const { game } = currentRound(group);

  const rules = useSignal<Rules | null>(null);
  const waitingStatus = useSignal<string | null>(null);

  // todo: as prop?
  const rulesId = 'loveletter';

  useEffect(() => {
    loadRules(rulesId).then((r) => rules.value = r);
  }, []);

  const canStartRound = rules.value
    ? findConfig(rules.value, group.users.value.length) !== undefined
    : false;

  const addGameAndNavigate = async () => {
    waitingStatus.value = 'Starting';
    const ref = await addGame(group);
    location.replace(new URL(`/groups/${ref.group}/games/${ref.game}`, location.href));
  };
  const endGameAndNavigate = async (game: GameState) => {
    waitingStatus.value = 'Ending';
    await endGame(game);
    location.replace(new URL(`/groups/${game.ref.group}`, location.href));
  };

  const contents = [];

  if (waitingStatus.value) {
    contents.push(
      <div class='mb-2'>
        <div class='p-4 rounded-full bg-gray-500'>
          <div class='w-10 h-10'>
            <NinetyRing width='100%' height='100%' color='white' />
          </div>
        </div>
        <div class='text-sm'>{waitingStatus.value}...</div>
      </div>,
    );
  } else if (game) {
    contents.push(
      <QuickActionButton
        title='End Game'
        color='red'
        icon={StopIcon}
        onSelect={() => endGameAndNavigate(game)}
      />,
    );
  } else {
    contents.push(
      <QuickActionButton
        title='Start Love Letter'
        color='green'
        icon={PlayIcon}
        disabled={!canStartRound}
        onSelect={addGameAndNavigate}
      />,
    );
  }

  const cls = 'flex justify-evenly items-center transition-all duration-200 overflow-hidden';
  return <div class={tw(cls, maxHeightCls(visible.value))}>{contents}</div>;
}
