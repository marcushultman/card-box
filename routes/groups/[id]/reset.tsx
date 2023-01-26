import { Handlers, PageProps } from '$fresh/server.ts';
import ResetGame from '../../../islands/ResetGame.tsx';
import { AuthState } from '../../../utils/auth_state.ts';
import { loadDecoratedGroupsForUser } from '../../../utils/loading_v2.ts';
import { DecoratedGroup } from '../../../utils/model_v2.ts';

interface Data extends AuthState {
  groups: DecoratedGroup[];
}

export const handler: Handlers<Data, AuthState> = {
  async GET(_, ctx) {
    return ctx.render({
      ...ctx.state,
      groups: await loadDecoratedGroupsForUser(ctx.state.authUser.id),
    });
  },
};

export default function ({ data }: PageProps<Data>) {
  return <ResetGame {...data} />;
}
