import { Handlers, PageProps } from '$fresh/server.ts';
import NewGameForm from '../islands/NewGameForm.tsx';
import { AuthState } from '../utils/auth_state.ts';

export const handler: Handlers<AuthState, AuthState> = {
  GET(_, ctx) {
    return ctx.render(ctx.state);
  },
};

export default function New({ data: { authUser } }: PageProps<AuthState>) {
  return <NewGameForm userId={authUser.id} />;
}
