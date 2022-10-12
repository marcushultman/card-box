import { Handlers, PageProps } from '$fresh/server.ts';
import {
  calculateLocalState,
  calculateSurfaces,
  Game,
  loadGame,
} from '../../../utils/game_engine.ts';
import ResetGame from '../../../islands/ResetGame.tsx';
import SurfacesArea from '../../../islands/SurfacesArea.tsx';
import GameSentinel from '../../../islands/GameSentinel.tsx';
import ChatWindow from '../../../islands/ChatWindow.tsx';

interface State {
  userid: string;
}

interface Data extends State {
  game: Game;
}

export const handler: Handlers<Data, State> = {
  async GET(req, ctx) {
    const game = await loadGame(ctx.params.id);

    if (
      !game.rounds.length ||
      !game.rounds[game.rounds.length - 1].players.includes(ctx.state.userid)
    ) {
      return Response.redirect(new URL('lobby', `${req.url}/`));
    }

    return ctx.render({ ...ctx.state, game });
  },
};

export default function ({ params: { id: gameId }, data: { userid, game } }: PageProps<Data>) {
  const { localSurfaces, surfaces, surfaceById } = calculateLocalState(game, userid);

  // const { mine, others, rest } = surfaces.reduce((agg, s) => {
  //   if (s.repeated) {
  //     if (s.repeated.value === userid) {
  //       agg.mine.push(s.id);
  //     } else {
  //       agg.others.push(s.id);
  //     }
  //   } else {
  //     agg.rest.push(s.id);
  //   }

  //   return agg;
  // }, { mine: [] as string[], others: [] as string[], rest: [] as string[] });

  // Organize surfaces in areas
  const others = surfaces.filter((s) => s.repeated?.value).map((s) => s.id);
  const rest = surfaces.filter((s) => !s.repeated?.value).map((s) => s.id);

  return (
    <body class='overscroll-x-none bg-coolGray-700 text-white'>
      <div class='w-screen h-screen overflow-scroll relative'>
        <GameSentinel gameId={gameId} game={game} />

        {/* <ResetGame gameId={gameId} game={game} /> */}

        <div class='overflow-hidden flex(& col) items-center' style={{ perspective: '240px' }}>
          <SurfacesArea
            userid={userid}
            gameId={gameId}
            game={game}
            surfaces={others}
            class='-mt-4'
            rotationX={10}
          />

          <SurfacesArea
            userid={userid}
            gameId={gameId}
            game={game}
            surfaces={rest}
            class='-mt-8 w-[175vw]'
            rotationX={10}
          />

          <SurfacesArea
            userid={userid}
            gameId={gameId}
            game={game}
            surfaces={localSurfaces.slice(1).map((s) => s.id)}
            rotationX={5}
          />

          <SurfacesArea
            userid={userid}
            gameId={gameId}
            game={game}
            surfaces={localSurfaces.slice(0, 1).map((s) => s.id)}
            rotationX={5}
            textBottom
            class='-mt-8'
          />
        </div>

        {
          /* <div>
          <a href='/logout'>LOGOUT</a>
        </div>

        <div>
          <a href='/'>to menu</a>
        </div> */
        }
      </div>

      <ChatWindow
        userid={userid}
        gameId={gameId}
        game={game}
        class='absolute bottom-0 w-screen text-black'
      />
    </body>
  );
}
