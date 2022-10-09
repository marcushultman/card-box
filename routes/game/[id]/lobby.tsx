import { Handlers, PageProps } from '$fresh/server.ts';
import { Game, loadGame } from '../../../utils/game_engine.ts';
import ResetGame from '../../../islands/ResetGame.tsx';
import GameLobby from '../../../islands/GameLobby.tsx';

interface State {
  userid: string;
}

interface Data extends State {
  game: Game;
}

export const handler: Handlers<Data, State> = {
  async GET(_, ctx) {
    return ctx.render({ ...ctx.state, game: await loadGame(ctx.params.id) });
  },
};

export default function ({ params: { id }, data: { userid, game } }: PageProps<Data>) {
  return (
    <div>
      <ResetGame gameId={id} game={game} />
      <GameLobby id={id} userid={userid} game={game} />
    </div>
  );
}
