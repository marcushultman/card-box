import { tw } from 'twind';
import { JSX } from 'preact';
import { updateProfile } from '../utils/loading_v2.ts';
import { Profile } from '../utils/model_v2.ts';
import { useProfiles } from '../utils/state_v2.ts';

interface Props {
  profile: Profile;
}

export default function EditName({ profile: profileData }: Props) {
  const [profile] = useProfiles([profileData]);

  const onChange: JSX.GenericEventHandler<HTMLInputElement> = (e) => {
    updateProfile(profile.value.id, { name: e.currentTarget.value });
  };

  const inputCls = tw`bg-transparent text-xl outline-none placeholder:italic`;

  return (
    <input
      id='name'
      name='name'
      value={profile.value.name}
      placeholder='Name'
      class={inputCls}
      onChange={onChange}
    />
  );
}
