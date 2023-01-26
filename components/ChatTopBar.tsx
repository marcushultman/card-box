import { JSX, VNode } from 'preact';
import { tw } from 'twind';
import { ArrowLeftIcon, HomeIcon } from '../utils/icons/24/outline.ts';
import { AuthState } from '../utils/auth_state.ts';
import { getPlayersFromGroupState, GroupState } from '../utils/state_v2.ts';
import { Profile } from '../utils/model_v2.ts';

interface GroupPicturesProps extends JSX.HTMLAttributes<HTMLDivElement> {
  players: Profile[];
}

export function GroupPictures({ players, class: cls, ...props }: GroupPicturesProps) {
  return (
    <div class={tw('relative', cls)} {...props}>
      {players.length >= 2
        ? [
          <img src={players[1].img} class='w-6 h-6 rounded-full absolute top-0.5 right-0.5' />,
          <img
            src={players[0].img}
            class='w-6 h-6 rounded-full absolute bottom-0.5 left-0.5'
          />,
        ]
        : players.length >= 1
        ? <img src={players[0].img} class='rounded-full' />
        : null}
    </div>
  );
}

interface Props extends AuthState, JSX.HTMLAttributes<HTMLDivElement> {
  group: GroupState;
  showHome?: boolean;
}

export default function ChatTopBar({ authUser, group, showHome, ...props }: Props) {
  const players = getPlayersFromGroupState(group);

  return (
    <div>
      <div class='flex items-center'>
        {showHome
          ? (
            <a class='p-3' href={`/`}>
              <HomeIcon className={tw`w-6`} />
            </a>
          )
          : null}
        <a class={tw('flex items-center p-2')} href={`/groups/${group.id}/settings`}>
          <GroupPictures class='w-10 h-10 mr-4' {...{ players }} />
          <div class='mr-8'>
            {players.length === 1
              ? 'You'
              : players.filter((p) => p.id !== authUser.id).map((p) => p.name).join()}
          </div>
        </a>
        <div class='flex-1 self-stretch' {...props} />
      </div>
      <hr></hr>
    </div>
  );
}
