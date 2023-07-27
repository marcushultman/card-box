import { tw } from 'twind';
import Chat from '../components/Chat.tsx';
import useTimestamp from '../utils/use_timestamp.ts';
import { AuthState } from '../utils/auth_state.ts';
import { DecoratedGroup, GroupAction } from '../utils/model_v2.ts';
import { useGroupState } from '../utils/state_v2.ts';
import ChatTopBar from '../components/ChatTopBar.tsx';

const LAST_SEEN_KEY = 'chat.v1.lastseen';

interface Props extends AuthState {
  groupData: DecoratedGroup;
}

export default function ChatView({ authUser, groupData }: Props) {
  const [_, updateLastSeen] = useTimestamp(LAST_SEEN_KEY);

  const group = useGroupState(groupData);

  return (
    <div class='absolute w-screen h-full flex'>
      <div class='w-full h-full overflow-hidden flex(& col) bg-white text-black'>
        <ChatTopBar {...{ authUser, group }} showHome />
        <Chat {...{ authUser, group, updateLastSeen }} />
      </div>
    </div>
  );
}
