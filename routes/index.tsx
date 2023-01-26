import { Handlers, PageProps } from '$fresh/server.ts';
import { loadDecoratedGroupsForUser, loadProfile } from '../utils/loading_v2.ts';
import { PlusIcon } from '../utils/icons/24/outline.ts';
import { ProfileIcon } from '../components/ProfileIcon.tsx';
import { AuthState } from '../utils/auth_state.ts';
import { DecoratedGroup, Profile } from '../utils/model_v2.ts';
import { GroupPictures } from '../components/ChatTopBar.tsx';

interface Data extends AuthState {
  profile: Profile;
  groups: DecoratedGroup[];
}

export const handler: Handlers<Data, AuthState> = {
  async GET(_, ctx) {
    const id = ctx.state.authUser.id;

    const [profile, groups] = await Promise.all([
      loadProfile(id),
      loadDecoratedGroupsForUser(id),
    ]);
    return ctx.render({ ...ctx.state, profile, groups });
  },
};

export default function Home({ data: { profile, groups } }: PageProps<Data>) {
  const imgUrl = 'https://via.placeholder.com/64/884444/ffffff';

  return (
    <div class='fixed w-screen h-full'>
      {/* Top bar */}
      <div class='flex items-center p-2'>
        <ProfileIcon {...profile} />
        <div class='flex-1 text(lg center) mr-12'>Groups</div>
      </div>
      <hr class='mb-2' />

      {groups.length
        ? groups.map(({ group, games, profiles }) => {
          const ruleName = games.at(-1)?.rules?.name;
          const others = Object.values(profiles).filter((p) => p.id !== profile.id);
          return (
            <a href={`/groups/${group.id}`}>
              <div class='flex px-2 gap-4 items-center'>
                {ruleName
                  ? (
                    <div class='relative my-1'>
                      <img class='w-12 h-12 rounded-full' src={imgUrl} />
                      <GroupPictures
                        class='absolute w-5 h-5 bottom-0.5 right-0.5'
                        players={others}
                      />
                    </div>
                  )
                  : <GroupPictures class='w-10 h-10 my-2' players={others} />}

                <div class='flex-1'>
                  <div class='text-lg'>{others.map((p) => p.name).join(', ')}</div>
                  <div class='text-xs italic'>
                    {ruleName ? `Playing ${ruleName}` : `No game in progress`}
                  </div>
                </div>
              </div>
            </a>
          );
        })
        : (
          <div class='h-full text-center py-4 text-gray-500'>
            <div>No groups</div>
          </div>
        )}

      {
        /* <a
        class='text-white absolute bottom-4 right-4 w-12 h-12 p-3 bg-cyan-400 rounded-full'
        href='/new'
      >
        <PlusIcon />
      </a> */
      }
    </div>
  );
}
