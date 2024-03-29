import { Handlers, PageProps } from '$fresh/server.ts';
import { addGroupUser, loadDecoratedGroupsForUser, loadProfile } from '../utils/loading_v2.ts';
import { PlusIcon, UserPlusIcon } from '../utils/icons/24/outline.ts';
import { ProfileIcon, ProfileLink } from '../components/Profile.tsx';
import { AuthState } from '../utils/auth_state.ts';
import { DecoratedGroup, Profile } from '../utils/model_v2.ts';
import { GroupPictures } from '../components/ChatTopBar.tsx';
import TopBar from '../components/TopBar.tsx';
import { PuzzlePieceIcon, UserCircleIcon } from '../utils/icons/24/solid.ts';
import { tw } from 'twind';

interface Data extends AuthState {
  profile: Profile;
  groups: DecoratedGroup[];
}

interface Invite {
  groupId: string;
  userId: string;
}

export const handler: Handlers<Data, AuthState> = {
  async GET(req, ctx) {
    const id = ctx.state.authUser.id;

    const inviteData = new URL(req.url).searchParams.get('invite');
    if (inviteData) {
      const { groupId, userId }: Invite = JSON.parse(atob(inviteData));
      await addGroupUser(groupId, [userId, id]);
    }

    const [profile, groups] = await Promise.all([
      loadProfile(id),
      loadDecoratedGroupsForUser(id, { actions: 1 }),
    ]);
    return ctx.render({ ...ctx.state, profile, groups });
  },
};

export default function Home({ data: { profile, groups } }: PageProps<Data>) {
  return (
    <div class='fixed w-screen h-full'>
      <TopBar title='Groups'>
        <ProfileLink {...profile} />
        <a class='w-10 h-10 p-2' href='/new'>
          <UserPlusIcon />
        </a>
      </TopBar>

      <div class='flex(& col) gap-2'>
        {groups.length
          ? groups.map(({ group, games, profiles, actions }) => {
            const game = games.at(-1);

            const others = Object.values(profiles).filter((p) => p.id !== profile.id);
            const lastMessage = actions.length > 0
              ? `${profiles[actions.at(-1)!.message!.author].name}: ${actions.at(-1)
                ?.message
                ?.message}`
              : undefined;

            return (
              <a href={`/groups/${group.id}`}>
                <div class='flex px-2 gap-4 items-center'>
                  {game
                    ? (
                      <div class='relative'>
                        {undefined
                          ? <img class='w-12 h-12 rounded-full' src={undefined} />
                          : <PuzzlePieceIcon className={tw`w-12 h-12 text-coolGray-600`} />}
                        <GroupPictures
                          className='absolute w-5 h-5 bottom-0.5 right-0.5'
                          players={others}
                        />
                      </div>
                    )
                    : others.length
                    ? <GroupPictures className='w-12 h-12' players={others} />
                    : <ProfileIcon size={12} {...profile} />}

                  <div class='flex-1'>
                    <div class='text-lg'>
                      {others.length ? others.map((p) => p.name).join(', ') : <i>New group</i>}
                    </div>
                    <div class='text-xs italic'>
                      {[
                        ...game ? [`Playing ${game.rules.name}`] : [],
                        ...lastMessage ? [lastMessage] : [],
                      ].join(' - ')}
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
      </div>

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
