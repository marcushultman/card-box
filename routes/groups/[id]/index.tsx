import { Handlers, PageProps } from '$fresh/server.ts';
import ChatView from '../../../islands/ChatView.tsx';
import { AuthState } from '../../../utils/auth_state.ts';
import { DecoratedGroup, GroupAction } from '../../../utils/model_v2.ts';
import { loadDecoratedGroup, loadGroupActions } from '../../../utils/loading_v2.ts';

interface Data extends AuthState {
  group: DecoratedGroup;
  actions: GroupAction[];
}

export const handler: Handlers<Data, AuthState> = {
  async GET(req, ctx) {
    const { id } = ctx.params;
    const [group, actions] = await Promise.all([loadDecoratedGroup(id), loadGroupActions(id)]);

    const { game } = group.games.at(-1) ?? {};

    if (game) {
      return Response.redirect(new URL(`/groups/${id}/games/${game.ref.game}`, req.url));
    }

    return ctx.render({ ...ctx.state, group, actions });
  },
};

// =================================================================================================

export default function ({ data: { authUser, group, actions } }: PageProps<Data>) {
  return <ChatView {...{ authUser, groupData: group, actions }} />;
}
