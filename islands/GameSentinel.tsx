import useGame from '../utils/use_game.ts';
import { Game } from '../utils/game_engine.ts';
import { useEffect } from 'preact/hooks';

interface Props {
  gameId: string;
  game: Game;
}

export default function GameSentinel({ gameId, game: initGame }: Props) {
  const { game } = useGame(gameId, initGame);

  useEffect(() => {
    if (!game.rounds.length) {
      window.location.replace(`/game/${gameId}/lobby`);
    }
  }, [game.rounds]);

  return <div></div>;
}
