import { useEffect, useState } from 'preact/hooks';
import {
  Action,
  addAction,
  addChatMessage,
  addSystemMessage,
  Game,
  joinGame,
  load,
  loadPlayers,
  loadRules,
  onDocs,
  resetGame,
  startRound,
} from './game_engine.ts';

function makeState(docs: Uint8Array[], game: Game) {
  const rules = loadRules(game.rules);
  const players = [
    ...(game.rounds.length ? loadPlayers(game.rounds[game.rounds.length - 1].players) : []),
    ...loadPlayers(game.waitingPlayers),
  ];
  return { docs, game, rules, players };
}

export default function useGame(id: string, initialGame: Game) {
  const [{ docs, game, rules, players }, setState] = useState(makeState([], initialGame));

  useEffect(() => {
    const sub = onDocs(id).subscribe((docs) => {
      docs.length && setState(makeState(docs, load<Game>(docs)));
    });
    return () => sub.unsubscribe();
  }, [id]);

  return {
    game,
    rules,
    players,
    joinGame: (userid: string) => joinGame(id, game, docs, userid),
    startRound: () => startRound(id, game, docs),
    addAction: (action: Omit<Action, 'time'>) => addAction(id, game, docs, action),
    resetGame: (hard: boolean) => resetGame(id, game, docs, hard),
    addChatMessage: (userid: string, message: string) =>
      addChatMessage(id, game, docs, userid, message),
    addSystemMessage: (message: string) => addSystemMessage(id, game, docs, message),
  };
}
