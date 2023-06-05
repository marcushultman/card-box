import { Handlers, PageProps } from '$fresh/server.ts';
import SurfacesRow, { RowType } from '../../../../../islands/SurfacesRow.tsx';
import ChatWindow from '../../../../../islands/ChatWindow.tsx';
import { ArrowLeftIcon } from '../../../../../utils/icons/24/outline.ts';
import { AuthState } from '../../../../../utils/auth_state.ts';
import chatWindow, { chatVisibilityFromUrl } from '../../../../../signals/chat_window.ts';
import { DecoratedGroup, GroupAction } from '../../../../../utils/model_v2.ts';
import { loadDecoratedGroup, loadGroupActions } from '../../../../../utils/loading_v2.ts';
import { AuthUser } from '../../../../../utils/auth_user.ts';
import { useEffect } from 'preact/hooks';
import { tw } from 'twind';

interface Data extends AuthState {
  group: DecoratedGroup;
  actions: GroupAction[];
}

export const handler: Handlers<Data, AuthState> = {
  async GET(req, ctx) {
    const { id, gameId } = ctx.params;
    const [group, actions] = await Promise.all([
      loadDecoratedGroup(id, [gameId]),
      loadGroupActions(id),
    ]);

    // todo: hook to setup global state
    chatWindow.visible.value = chatVisibilityFromUrl(req.url);

    // if the selected game is not loaded, go back to group page
    const game = group.games.find((game) => game.game.ref.game === gameId);

    if (!game || game.game.ended) {
      return Response.redirect(new URL(`/groups/${id}`, req.url));
    }

    return ctx.render({ ...ctx.state, group, actions });
  },
};

// =================================================================================================

export default function ({ data: { authUser, group, actions } }: PageProps<Data>) {
  const transform = 'translateZ(-100px) rotateX(25deg)';
  const boardCls = 'fixed w-screen h-full overflow(x-hidden y-scroll) flex justify-center';
  const boardStyle = { perspective: '900px', perspectiveOrigin: '50% 500px' };
  const data = { authUser, groupData: group, actions };

  return (
    <body class='overflow-hidden overscroll-x-none select-none bg-coolGray-700 text-white'>
      {/* todo: can't check for this in a non-island...  */}
      <div class={boardCls} style={boardStyle}>
        <div class='flex(& col) items-center origin-top m-auto' style={{ transform }}>
          <SurfacesRow {...data} type={RowType.TOP} />
          <SurfacesRow {...data} type={RowType.CENTER} />
          <SurfacesRow {...data} type={RowType.BOTTOM} />
        </div>
      </div>

      <a class='absolute top-2 left-2 p-2' href='/'>
        <ArrowLeftIcon className='w-6' />
      </a>

      <ChatWindow {...data} />
    </body>
  );
}
