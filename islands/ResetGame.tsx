import { AuthState } from '../utils/auth_state.ts';
import { DecoratedGroup } from '../utils/model_v2.ts';
import { clearActions, clearGames } from '../utils/loading_v2.ts';

interface Props extends AuthState {
  groups: DecoratedGroup[];
}

export default function ResetGame({ groups }: Props) {
  const clearCache = () => {};

  return (
    <div class='flex(& col)'>
      {groups.map(({ group, games, profiles }) => (
        <div>
          <h1>{Object.values(profiles).map((p) => p.name).join()}</h1>

          <button onClick={() => clearGames(group.id)}>groups/{group.id}: Clear games</button>

          {games.map(({ rounds }, i) => (
            <div>
              <div>Game {i + 1}</div>
              {rounds?.map((round, i) => (
                <div>
                  <div>Round {i + 1}</div>
                  <button onClick={() => clearActions(round.ref)}>
                    RESET ROUND
                  </button>
                </div>
              ))}
            </div>
          ))}
          <button onClick={() => clearCache()}>CLEAR CACHE</button>
        </div>
      ))}
    </div>
  );
}
