import { JSX, VNode } from 'preact';
import { tw } from 'twind';
import { ArrowLeftIcon, HomeIcon } from '../utils/icons/24/outline.ts';
import { AuthState } from '../utils/auth_state.ts';
import { getPlayersFromGroupState, GroupState } from '../utils/state_v2.ts';
import { Profile } from '../utils/model_v2.ts';
import TopBar from './TopBar.tsx';
import { UserIcon } from '../utils/icons/24/solid.ts';

interface GroupPicturesProps extends JSX.HTMLAttributes<HTMLDivElement> {
  players: Profile[];
}

export function GroupPictures({ players, class: cls, ...props }: GroupPicturesProps) {
  const upperRightCls = 'w-6 h-6 rounded-full absolute top-0.5 right-0.5';
  const lowerLeftCls = 'w-6 h-6 rounded-full absolute bottom-0.5 left-0.5';
  const iconCls = 'p-1 text-white bg-coolGray-400';

  return (
    <div class={tw('relative', cls)} {...props}>
      {players.length >= 2
        ? [
          players[1].img
            ? <img src={players[1].img} class={upperRightCls} />
            : <UserIcon className={tw(upperRightCls, iconCls)} />,
          players[0].img
            ? <img src={players[0].img} class={lowerLeftCls} />
            : <UserIcon className={tw(lowerLeftCls, iconCls)} />,
        ]
        : players.length == 1
        ? (players[0].img
          ? <img src={players[0].img} class='rounded-full' />
          : <UserIcon className={tw('rounded-full', iconCls)} />)
        : null}
    </div>
  );
}

interface Props extends AuthState {
  group: GroupState;
  showHome?: boolean;
}

export default function ChatTopBar({ authUser, group, showHome, ...props }: Props) {
  const players = getPlayersFromGroupState(group);
  const title = (
    <a class={tw('flex(& 1) items-center gap-4')} href={`/groups/${group.id}/settings`}>
      <GroupPictures class='w-10 h-10' {...{ players }} />
      <div>
        {players.length === 1
          ? 'You'
          : players.filter((p) => p.id !== authUser.id).map((p) => p.name).join()}
      </div>
      <div class='self-stretch flex-1' {...props}></div>
    </a>
  );

  return (
    <TopBar {...{ title }}>
      {showHome && (
        <a class='p-2 z-50' href={`/`}>
          <ArrowLeftIcon className={tw`w-6`} />
        </a>
      )}
    </TopBar>
  );
}
