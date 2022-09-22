import { Handlers, PageProps } from '$fresh/server.ts';
import { calculateSurfaces, loadGame } from '../../../utils/game_engine.ts';
import Chat from '../../../islands/Chat.tsx';
import SurfaceView from '../../../islands/SurfaceView.tsx';
import OfflineMode from '../../../islands/OfflineMode.tsx';
import ResetGame from '../../../islands/ResetGame.tsx';

export const handler: Handlers = {
  async GET(_, ctx) {
    return ctx.render(await loadGame(ctx.params.id));
  },
};

const AUTHOR = 'Marcus';

export default function (
  { params: { id }, data: game }: PageProps<Awaited<ReturnType<typeof loadGame>>>,
) {
  const { surfaces } = calculateSurfaces(game);

  const gridSize = game.players.length <= 8 ? 3 : 4;
  const gridTmp = `repeat(${gridSize}, minmax(8rem, auto))`;
  const gridStyle = { 'grid-template-columns': gridTmp, 'grid-template-rows': gridTmp };

  return (
    <div class='flex flex-col p-2 items-center space-y-2'>
      <h1 class='font-bold'>ADMIN</h1>
      <ResetGame gameId={id} />
      <OfflineMode />
      <Chat author={AUTHOR} gameId={id} />
      <div class='grid' style={gridStyle}>
        {surfaces.map((surface) => <SurfaceView author={AUTHOR} gameId={id} surface={surface} />)}
      </div>
    </div>
  );
}
