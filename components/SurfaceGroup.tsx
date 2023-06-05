// import {
//   DecoratedItem,
//   DecoratedLocalSurface,
//   DecoratedPlayer,
//   DecoratedSurface,
// } from '../utils/game_engine.ts';
import { selectedItem } from '../signals/selection.ts';
import { Profile } from '../utils/model_v2.ts';
import { DecoratedItem, DecoratedLocalSurface, DecoratedSurface } from '../utils/rules_v2.ts';
import SurfaceView from './SurfaceView.tsx';

type Surface = DecoratedLocalSurface;

type OnItemSelect = (surface: Surface, item: DecoratedItem | null) => Promise<void>;

interface Props {
  profile: Profile;
  surfaces: DecoratedLocalSurface[];
  onItemSelect: OnItemSelect;
}

export default function SurfaceGroup({ profile, surfaces, onItemSelect }: Props) {
  const { name } = profile ?? {};
  return (
    <div className={'mx-2 backdrop(filter blur-sm) bg-coolGray-600 rounded-xl py-4 px-6'}>
      {surfaces[0].repeated ? <div class='text-center'>{name}</div> : null}
      {surfaces.map((surface) => <SurfaceView {...{ surface, onItemSelect, selectedItem }} />)}
    </div>
  );
}
