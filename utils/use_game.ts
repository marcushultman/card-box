import { useEffect, useState } from 'preact/hooks';
import {
  Action,
  addAction,
  addChatMessage,
  addSystemMessage,
  Game,
  load,
  onDocs,
  resetGame,
} from './game_engine.ts';

function assertGame(game: Game | undefined): asserts game {
  if (!game) {
    throw new Error('game not loaded yet');
  }
}

export default function useGame(id: string) {
  const [docs, setDocs] = useState<Uint8Array[]>([]);
  const [game, setGame] = useState<Game>();

  useEffect(() => {
    const sub = onDocs(id).subscribe(setDocs);
    return () => sub.unsubscribe();
  }, [id]);

  useEffect(() => {
    setGame(docs.length ? load<Game>(docs) : undefined);
  }, [docs]);

  return {
    game,
    addAction: (action: Omit<Action, 'time'>) => {
      assertGame(game);
      addAction(id, game, docs, action);
    },
    resetGame: (hard: boolean) => {
      assertGame(game);
      resetGame(id, game, docs, hard);
    },
    addChatMessage: (author: string, message: string) => {
      assertGame(game);
      addChatMessage(id, game, docs, author, message);
    },
    addSystemMessage: (message: string) => {
      assertGame(game);
      addSystemMessage(id, game, docs, message);
    },
  };
}
