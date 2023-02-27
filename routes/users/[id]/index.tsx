import { tw } from 'twind';
import { Handlers, PageProps } from '$fresh/server.ts';
import EditImage from '../../../islands/EditImage.tsx';
import EditName from '../../../islands/EditName.tsx';
import { ArrowLeftIcon } from '../../../utils/icons/24/outline.ts';
import ChatNotificationSetting from '../../../islands/ChatNotificationSetting.tsx';
import { AuthState } from '../../../utils/auth_state.ts';
import { Profile } from '../../../utils/model_v2.ts';
import { loadProfile, updateProfile } from '../../../utils/loading_v2.ts';

interface Data extends AuthState {
  profile: Profile;
}

export const handler: Handlers<Data, AuthState> = {
  async GET(_, ctx) {
    const profile = await loadProfile(ctx.params.id);
    return ctx.render({ ...ctx.state, profile });
  },
};

export default function UserPage({ data: { profile } }: PageProps<Data>) {
  return (
    <div class='fixed p-4 w-screen h-full'>
      <div class='flex items-center'>
        <a class='p-2' href='javascript:history.back()'>
          <ArrowLeftIcon className={tw`w-6`} />
        </a>
        <div class='flex-1 py-2 text(lg center) mr-10'>Settings</div>
      </div>

      <div class='my-2 flex gap-4 items-center'>
        <EditImage profile={profile} />
        <EditName profile={profile} />
      </div>

      <ChatNotificationSetting profile={profile} />

      <div class='m-4 flex justify-center'>
        <a href='/logout' class='text(white lg) px-8 py-2 bg-red-500 rounded-full'>Logout</a>
      </div>
    </div>
  );
}