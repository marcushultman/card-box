import useGame from '../utils/use_game.ts';
import { clearCache } from '../utils/game_engine.ts';

interface Props {
  gameId: string;
}

export default function OfflineMode({ gameId }: Props) {
  const { resetGame } = useGame(gameId);

  return (
    <div>
      <div>
        <button onClick={() => resetGame(true)}>HARD RESET</button>
      </div>
      <div>
        <button onClick={() => resetGame(false)}>RESET GAME</button>
      </div>
      <div>
        <button onClick={() => clearCache()}>CLEAR CACHE</button>
      </div>
    </div>
  );
}
