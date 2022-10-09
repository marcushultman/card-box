import { Handlers, PageProps } from '$fresh/server.ts';
import { loadGames, loadPlayers, loadRules } from '../utils/game_engine.ts';
import PlusIcon from 'https://esm.sh/@heroicons/react@2.0.11/24/outline/PlusIcon?alias=react:preact/compat';
import { ProfileIcon } from '../components/ProfileIcon.tsx';

async function loadAll() {
  const games = await loadGames();
  return games.map(({ id, game }) => {
    const round = game.rounds.length ? game.rounds[game.rounds.length - 1] : undefined;
    return {
      id,
      game,
      round,
      rules: loadRules(game.rules),
      players: [...(round ? loadPlayers(round.players) : []), ...loadPlayers(game.waitingPlayers)],
    };
  });
}

interface State {
  userid: string;
}

interface Data extends State {
  games: Awaited<ReturnType<typeof loadAll>>;
}

export const handler: Handlers<Data, State> = {
  async GET(_, ctx) {
    return ctx.render({ ...ctx.state, games: await loadAll() });
  },
};

export default function Home({ data: { games, userid } }: PageProps<Data>) {
  return (
    <div class='p-4 w-screen h-screen relative bg-coolGray-700'>
      <ProfileIcon userid={userid} class='flex items-center absolute' />
      <div class='py-3 mb-3 font-bold text(white center lg)'>Games</div>

      {games.map(({ id, round, rules, players }) => (
        <a href={`/game/${id}`} class='flex p-4 rounded-lg text-white bg-coolGray-500 items-center'>
          <img class='w-16 h-16 mr-4 rounded' src='https://via.placeholder.com/64/884444/ffffff' />
          <div class='flex-1'>
            <div class='text-lg'>{rules.name}</div>
            <div>{players.length} players</div>
          </div>
          <div>{round ? '' : 'waiting to start...'}</div>
        </a>
      ))}

      {
        /* <a
        class='text-white leading-2 absolute bottom-8 right-8 w-14 h-14 p-3 bg-blue-400 rounded-full'
        href='/new'
      >
        <PlusIcon />
      </a> */
      }
    </div>
  );
}
