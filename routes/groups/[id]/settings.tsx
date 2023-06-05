import { Handlers, PageProps } from '$fresh/server.ts';
import SurfacesRow, { RowType } from '../../../islands/SurfacesRow.tsx';
import ChatWindow from '../../../islands/ChatWindow.tsx';
import { ArrowLeftIcon, HomeIcon } from '../../../utils/icons/24/outline.ts';
import { AuthState } from '../../../utils/auth_state.ts';
import chatWindow, { chatVisibilityFromUrl } from '../../../signals/chat_window.ts';
import { DecoratedGroup, GroupAction, RoundAction } from '../../../utils/model_v2.ts';
import { loadDecoratedGroup, loadGroupActions } from '../../../utils/loading_v2.ts';
import { AuthUser } from '../../../utils/auth_user.ts';
import { useEffect } from 'preact/hooks';
import { tw } from 'twind';
import moment from 'moment';
import { PlayerWidgets } from '../../../components/PlayerWidgets.tsx';
import { findConfig, findGameConfig } from '../../../utils/game_engine_v2.ts';
import { useGroupState } from '../../../utils/state_v2.ts';
import ScoreBoard from '../../../islands/ScoreBoard.tsx';
import GroupSettingsButton from '../../../islands/GroupSettingsButton.tsx';
import TopBar from '../../../components/TopBar.tsx';

interface Data extends AuthState {
  group: DecoratedGroup;
  actions: GroupAction[];
}

export const handler: Handlers<Data, AuthState> = {
  async POST(req, ctx) {
    const data = await req.formData();
    const action = data.get('action');

    if (action === 'leave') {
      // todo: implement leave
      return Response.redirect(new URL(`/`, req.url));
    }

    return ctx.render();
  },
  async GET(_, ctx) {
    const { id } = ctx.params;
    const [group, actions] = await Promise.all([loadDecoratedGroup(id), loadGroupActions(id)]);

    return ctx.render({ ...ctx.state, group, actions });
  },
};

// =================================================================================================

export default function ({ data: { authUser, group, actions } }: PageProps<Data>) {
  //

  const currentGame = group.games.at(-1);

  const title = currentGame
    ? (
      <div class='flex-1 text-center'>
        <span>{currentGame.rules.name}</span>
        <span class='italic text-sm'>&nbsp;-&nbsp;Round {currentGame.rounds.length}</span>
        <div class='italic text-xs'>
          {moment(new Date(currentGame.rounds.at(-1)?.startTime ?? 0)).fromNow()}
        </div>
      </div>
    )
    : 'Group Settings';

  return (
    <div>
      <TopBar {...{ title }}>
        <a class='p-2 w-10 h-10' href='javascript:history.back()'>
          <ArrowLeftIcon className='-z-10' />
        </a>
      </TopBar>

      {currentGame && [
        <ScoreBoard groupData={group} />,
        <GroupSettingsButton class='mt-8' groupData={group} />,
      ]}

      <form method='post' class='flex justify-center'>
        <input type='hidden' name='action' value='leave' />
        <button class='px-4 py-2 rounded-full bg-red-400'>
          Leave group
        </button>
      </form>

      {/* todo: move to island and make interactive */}
      {
        /* <div class='px-4'>
        {recentGames.length > 0 && [
          <div class='text(lg center) font-bold my-2'>Recent games</div>,
          <div class='text-center'>
            {recentGames.map((game) => (
              <div>
                <i>{game.rules.name}</i>
                <>{moment(new Date(game.rounds.at(-1)?.startTime ?? 0)).fromNow()}</>
              </div>
            ))}
          </div>,
        ]}
      </div> */
      }
    </div>
  );
}
