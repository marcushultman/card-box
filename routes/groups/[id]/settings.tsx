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

interface Data extends AuthState {
  group: DecoratedGroup;
  actions: GroupAction[];
}

export const handler: Handlers<Data, AuthState> = {
  async GET(req, ctx) {
    const { id } = ctx.params;
    const [group, actions] = await Promise.all([loadDecoratedGroup(id), loadGroupActions(id)]);

    return ctx.render({ ...ctx.state, group, actions });
  },
};

// =================================================================================================

export default function ({ data: { authUser, group, actions } }: PageProps<Data>) {
  //

  const currentGame = group.games.at(-1);
  // const recentGames = group.games.slice(0, -1);

  return (
    <div>
      <div class='flex m-2 '>
        <a class='p-2 w-10 h-10' href='javascript:history.back()'>
          <ArrowLeftIcon className='-z-10' />
        </a>

        {currentGame
          ? (
            <div class='my-1 mr-10 flex-1 text-center'>
              <span class='text-lg font-bold'>{currentGame.rules.name}</span>
              <span class='italic'>&nbsp;-&nbsp;Round {currentGame.rounds.length}</span>
              <div class='italic text-sm'>
                {moment(new Date(currentGame.rounds.at(-1)?.startTime ?? 0)).fromNow()}
              </div>
            </div>
          )
          : (
            <div class='mr-10 flex-1 text-center'>
              Group Settings
            </div>
          )}
      </div>

      <ScoreBoard groupData={group} />
      <GroupSettingsButton class='mt-8' groupData={group} />

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
