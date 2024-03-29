import { JSX } from 'preact';
import { tw } from 'twind';
import { PencilSquareIcon, UserCircleIcon, UserIcon } from '../utils/icons/24/solid.ts';
import { Profile } from '../utils/model_v2.ts';
import { useProfiles } from '../utils/state_v2.ts';
import { updateProfile } from '../utils/loading_v2.ts';

interface Props {
  profile: Profile;
}

export default function EditImage({ profile: profileData }: Props) {
  const [profile] = useProfiles([profileData]);

  const onChange: JSX.GenericEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.item(0);
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateProfile(profile.value.id, { img: reader.result as string });
    reader.readAsDataURL(file);
  };

  const wrapperCls = 'flex-shrink-0 w-24 h-24 rounded-full relative overflow-hidden text-white';
  const imgCls = 'w-full h-full';
  const editCls =
    'w-full absolute bottom-0 bg(black opacity-50) text-xs uppercase pt-1 pb-2 flex gap-1 justify-center';
  const inputCls = 'absolute inset-0 opacity-0';

  return (
    <div class={wrapperCls}>
      {profile.value.img
        ? <img class={imgCls} src={profile.value.img} alt={profile.value.name} />
        : <UserIcon className={tw`${imgCls} p-4 text-white bg-coolGray-400`} />}
      <div class={editCls}>
        <PencilSquareIcon className={tw`w-3`} />
        <span>edit</span>
      </div>
      <input type='file' name='img' accept='image/*' class={inputCls} onChange={onChange} />
    </div>
  );
}
