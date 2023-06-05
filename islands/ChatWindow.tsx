import { JSX } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import { batch, computed, useSignal } from '@preact/signals';
import { tw } from 'twind';
import { ChatBubbleLeftIcon, EyeIcon } from '../utils/icons/24/outline.ts';
import { ActionButton } from '../components/ActionButton.tsx';
import Chat from '../components/Chat.tsx';
import globalSelection, { Selection } from '../signals/selection.ts';
import useTimestamp from '../utils/use_timestamp.ts';
import chatWindow from '../signals/chat_window.ts';
import { AuthState } from '../utils/auth_state.ts';
import { Attachment, DecoratedGroup, GroupAction } from '../utils/model_v2.ts';
import { getItems, getLocalSurfaces, getSurfaces, viewForItem } from '../utils/game_engine_v2.ts';
import { GroupState, useGroupState } from '../utils/state_v2.ts';
import { onGroupActions } from '../utils/loading_v2.ts';
import { filter, tap } from 'rxjs';
import ChatTopBar from '../components/ChatTopBar.tsx';

const closeChat = () => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.delete('chat');
  history.replaceState(null, '', `?${searchParams.toString()}`);
  chatWindow.visible.value = false;
};

function Backdrop() {
  const visible = chatWindow.visible.value;
  const cls = tw('absolute inset-0', visible ? 'bg-[#00000066]' : 'hidden');
  return <div class={cls} onClick={closeChat} />;
}

const LAST_SEEN_KEY = 'chat.v1.lastseen';

function ActionButtons(
  { authUser, group, lastSeen, openChat }: AuthState & {
    group: GroupState;
    lastSeen: Date;
    openChat: (display?: { attachment?: Attachment }) => void;
  },
) {
  const surfaces = getLocalSurfaces(group, authUser.id);

  const showCard = (selection: Selection) => {
    if (!surfaces) {
      return;
    }
    globalSelection.value = undefined;
    const surface = surfaces[selection.surface];
    const item = surface.items.find((item) => item.id === selection.item);
    if (item) {
      const itemView = viewForItem(surface, item);
      openChat({ attachment: { itemId: item.id, itemView } });
    }
  };

  const unreadMessages = group.actions.value.filter((a) => a.time > lastSeen.valueOf());

  const buttons = [
    <ActionButton onClick={() => openChat()} unread={unreadMessages.length}>
      <ChatBubbleLeftIcon />
    </ActionButton>,
  ];

  const selection = globalSelection.value;
  if (selection && surfaces) {
    const surface = surfaces[selection.surface];

    if (surface.actions?.promptShow && surface.repeated?.value === authUser.id) {
      buttons.unshift(
        <ActionButton small tooltip='Show card' onClick={() => showCard(selection)}>
          <EyeIcon />
        </ActionButton>,
      );
    }
  }

  const visible = chatWindow.visible.value;
  const cls = tw(
    'absolute bottom-4 right-4 text-white flex(& col) items-center gap-2',
    visible ? 'hidden' : 'pointer-events-auto',
  );

  return <div class={cls}>{buttons}</div>;
}

// =============================================================================

const maxHeightCls = (full: boolean) => full ? tw`max-h-full` : tw`max-h-0`;

function ChatDrawer({ children }: JSX.HTMLAttributes<HTMLDivElement>) {
  const cls = tw(
    'transition-[max-height] duration-75 ease-in pointer-events-auto w-full h-[90vh] overflow-hidden rounded-t-lg flex(& col) bg-white text-black',
    maxHeightCls(chatWindow.visible.value),
  );
  const transform = `translateY(${chatWindow.touchOffset.value}px)`;

  return (
    <div class={cls} style={{ transform }}>
      {children}
    </div>
  );
}

// =============================================================================

const touches = new Map<number, number>();

interface Props extends AuthState {
  groupData: DecoratedGroup;
  actions: GroupAction[];
}

export default function ChatWindow({ authUser, groupData, actions }: Props) {
  const [lastSeen, updateLastSeen] = useTimestamp(LAST_SEEN_KEY);

  const group = useGroupState(groupData, actions);

  // Keep last seen up-to-date
  useEffect(() => {
    const s = onGroupActions(group.id, 1).pipe(
      filter(() => chatWindow.visible.value),
      tap(() => updateLastSeen()),
    ).subscribe();
    return () => s.unsubscribe();
  }, []);

  const items = getItems(getSurfaces(group) ?? {});

  const onTouchStart = (e: JSX.TargetedTouchEvent<HTMLDivElement>) => {
    if (e.changedTouches.length) {
      const touch = e.changedTouches.item(0)!;
      touches.set(touch.identifier, touch.clientY);
    }
    e.preventDefault();
    e.stopPropagation();
  };
  const onTouchMove = (e: JSX.TargetedTouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; ++i) {
      const touch = e.changedTouches.item(i)!;
      if (touches.has(touch.identifier)) {
        const startY = touches.get(touch.identifier)!;

        chatWindow.touchOffset.value = Math.max(0, touch.clientY - startY);
        return;
      }
    }
  };
  const onTouchEnd = () => {
    touches.clear();
    if (chatWindow.touchOffset.value > 100) {
      closeChat();
    } else {
      chatWindow.touchOffset.value = 0;
    }
  };
  const touchHandlers = { onTouchStart, onTouchMove, onTouchEnd };

  const openChat = (display?: { attachment?: Attachment }) => {
    updateLastSeen();

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('chat', '1');
    history.replaceState(null, '', `?${searchParams.toString()}`);

    batch(() => {
      if (display?.attachment && items) {
        const { itemId, itemView } = display.attachment;
        const variant = items[itemId].variants[itemView];

        chatWindow.item.value = display.attachment;
        chatWindow.text.value = variant.name ?? '';
      }
      chatWindow.visible.value = true;
      chatWindow.touchOffset.value = 0;
    });
  };

  const cls = tw(
    `absolute inset-0 flex items-end`,
    chatWindow.visible.value || 'pointer-events-none',
  );

  return (
    <div class={cls}>
      <Backdrop />
      <ActionButtons {...{ authUser, group, lastSeen, openChat }} />
      <ChatDrawer>
        <ChatTopBar {...{ authUser, group, ...touchHandlers }} />
        <Chat {...{ authUser, group, updateLastSeen }} />
      </ChatDrawer>
    </div>
  );
}
