import useGame from '../utils/use_game.ts';
import { clearCache, Game } from '../utils/game_engine.ts';

interface Props {
  gameId: string;
  game: Game;
}

export default function ResetGame({ gameId, game }: Props) {
  const { resetGame } = useGame(gameId, game);

  return (
    <div class='flex(& col)'>
      <button onClick={() => resetGame(true)}>HARD RESET</button>
      <button onClick={() => resetGame(false)}>RESET GAME</button>
      <button onClick={() => clearCache()}>CLEAR CACHE</button>
    </div>
  );
}
