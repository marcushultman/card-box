import { Game } from '../utils/game_engine.ts';
import useGame from '../utils/use_game.ts';
import { tw } from 'twind';
import { useEffect } from 'preact/hooks';

interface Props {
  id: string;
  userid: string;
  game: Game;
}

export default function GameLobby({ id, userid, game: initGame }: Props) {
  const { game, rules, players, startRound, joinGame } = useGame(id, initGame);

  const playerItemCls = tw`flex mb-2 p-2 rounded bg-coolGray-800 items-center`;
  const playerImgCls = tw`w-12 h-12 mr-4 rounded-full`;

  const localPlayer = players.find((p) => p.id === userid);
  const localPlayerCls = tw`self-center px-12 py-3 m-2 rounded-full bg-blue-400`;

  const canStart = rules.configs.some(({ when: { minPlayers, maxPlayers } }) =>
    players.length >= minPlayers && players.length <= (maxPlayers ?? Infinity)
  );

  // Go to game view when round starts
  useEffect(() => {
    if (game.rounds.length) {
      window.location.replace(`/game/${id}`);
    }
  }, [game.rounds]);

  const startGame = async () => {
    await startRound();
    window.location.replace(`/game/${id}`);
  };

  return (
    <div class='p-4 w-screen h-screen bg-coolGray-700 text-white flex(& col)'>
      <div class='text-center text-2xl mb-4'>{rules.name}</div>
      {players.length
        ? (
          players.map(({ name, img }) => (
            <div class={playerItemCls}>
              <img class={playerImgCls} src={img} />
              <div>{name}</div>
            </div>
          ))
        )
        : <div class='text-center'>Waiting for players...</div>}
      <div class='my-2 flex flex-wrap justify-evenly'>
        {localPlayer ? null : (
          <button class={localPlayerCls} onClick={() => joinGame(userid)}>
            Join game
          </button>
        )}

        <button
          class={`self-center px-12 py-3 m-2 rounded-full ${
            canStart ? 'bg-blue-400' : 'bg-gray-400'
          }`}
          onClick={startGame}
          disabled={!canStart}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
