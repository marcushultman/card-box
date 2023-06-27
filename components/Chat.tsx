import { h, JSX } from 'preact';
import { tw } from 'twind';
import { Item, Surface, Variants } from '../utils/rules.ts';
import { useEffect } from 'preact/hooks';
import { PlayerWidgets } from './PlayerWidgets.tsx';
import chatWindow from '../signals/chat_window.ts';
import {
  ArrowLeftIcon,
  Bars3Icon,
  Cog8ToothIcon,
  EllipsisVerticalIcon,
  HomeIcon,
  PaperAirplaneIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
} from '../utils/icons/24/outline.ts';
import moment from 'moment';
import { onMessage } from '../utils/messaging.ts';
import { tap } from 'rxjs';
import { batch, useComputed, useSignal } from '@preact/signals';
import { useRef } from 'preact/hooks';
import { Card } from './Card.tsx';
import { AuthState } from '../utils/auth_state.ts';
import {
  Attachment,
  GroupAction,
  Message,
  Profile,
  RoundAction,
  Transaction,
  WithPartialId,
} from '../utils/model_v2.ts';
import {
  addGame,
  addMessage,
  addRound,
  getPlayersFromGroupState,
  GroupState,
  removeMessage,
} from '../utils/state_v2.ts';
import {
  currentRound,
  decorateTransaction,
  getItems,
  getSurfaces,
} from '../utils/game_engine_v2.ts';
import QuickActions from './QuickActions.tsx';

const byTime = (dir: number) => (lhs: { time: number }, rhs: { time: number }) =>
  dir * (lhs.time - rhs.time);

type MessageAction = WithPartialId<GroupAction> & Required<Pick<GroupAction, 'message'>>;
type MessageGroup = { author: string; messages: MessageAction[] };
type Event = (WithPartialId<GroupAction> | RoundAction) & { messageGroup?: MessageGroup };

const hasMessage = (e: Event): e is MessageAction => 'message' in e && !!e.message;

const lookupName = (variants: Variants, keys?: string[]) => {
  const key = keys?.find((key) => key in variants);
  return key ? variants[key].name : undefined;
};

const logName = (item: Item, from: Surface, to: Surface) =>
  lookupName(item.variants, from.itemViews.logFrom) ??
    lookupName(item.variants, to.itemViews.logTo) ??
    lookupName(item.variants, from.itemViews.log) ??
    lookupName(item.variants, to.itemViews.log) ??
    lookupName(item.variants, from.itemViews.default) ??
    lookupName(item.variants, to.itemViews.default) ??
    item.name;

// =============================================================================

interface Props extends AuthState {
  group: GroupState;
  updateLastSeen: () => void;
}

export default function Chat({ authUser, group, updateLastSeen }: Props) {
  const { game, round } = currentRound(group);

  const selectedMessage = useSignal<string | undefined>(undefined);

  const players = getPlayersFromGroupState(group);

  const surfaces = getSurfaces(group) ?? {};
  const items = getItems(surfaces);

  const inputRef = useRef<HTMLInputElement>(null);

  const timeCls = tw`text(sm gray-500) my-1`;
  const userCls = tw`w-8 h-8 leading-8 text-white bg-gray-800 rounded-full`;
  const messageCls = tw`rounded-2xl px-4 py-1.5`;

  const sendMessage = async (e: h.JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();

    inputRef.current?.focus();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get('message');

    if (typeof message !== 'string' || message.length === 0) {
      return;
    }

    const lowercaseMessage = message.toLocaleLowerCase();
    const taggedPlayers = players.filter((p) =>
      lowercaseMessage.includes(p.name.toLocaleLowerCase())
    );
    const attachments: Attachment[] = [];

    // if (lowercaseMessage === 'start') {
    //   addGame(group);
    // }
    // if (game && lowercaseMessage === 'startround') {
    //   addRound(game);
    // }

    if (chatWindow.item.value) {
      attachments.push({ ...chatWindow.item.value });
    }

    batch(() => {
      chatWindow.text.value = '';
      chatWindow.item.value = null;
    });

    await addMessage(group, { author: authUser.id, message, attachments, visibleFor: null });
    updateLastSeen();

    // Send notifications to tagged players (todo: revisit this)
    if (taggedPlayers.length) {
      fetch(`/api/group/${group.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: taggedPlayers.map((p) => p.id), message }),
      });
    }
  };

  // Subscribe to message notifications
  useEffect(() => {
    const unsub = onMessage().pipe(tap((x) => console.log({ x }))).subscribe();
    return () => unsub.unsubscribe();
  }, []);

  function shouldCombine(
    lhs: Event | undefined,
    rhs: Event & Required<Pick<GroupAction, 'message'>>,
  ): lhs is Event & Required<Pick<Event, 'messageGroup'>> {
    return !!lhs && !!lhs.messageGroup && rhs.time - lhs.time < 60 * 60 * 1000 &&
      rhs.message.author === lhs.messageGroup.author;
  }

  const actions = [...group.actions.value, ...round?.actions.value ?? []];

  const events: Event[] = actions
    .sort(byTime(1))
    .reduce<Event[]>((events, action) => {
      if (hasMessage(action)) {
        const event = events.at(-1);
        if (shouldCombine(event, action)) {
          event.messageGroup.messages.push(action);
        } else {
          const { time, message: { author } } = action;
          events.push({ time, messageGroup: { author, messages: [action] } });
        }
      } else {
        events.push(action);
      }
      return events;
    }, [])
    .sort(byTime(-1));

  // RENDER

  const renderTime = (time: number) => (
    <div class={timeCls}>
      {moment(new Date(time)).fromNow()}
    </div>
  );

  const renderAttachment = ({ itemId, itemView }: Attachment) => (
    <Card variant={items[itemId].variants[itemView]} />
  );

  const renderTransaction = (time: number, transaction: Transaction) => {
    const shouldRender = surfaces[transaction.from].log?.from &&
      surfaces[transaction.to].log?.to;

    if (!shouldRender) {
      return;
    }
    const { from, to, item } = decorateTransaction(surfaces, transaction);

    const itemName = logName(item, from, to);
    const player = players.find((p) => p.id === transaction.userid);

    if (!itemName || !player) {
      return null;
    }
    return (
      <div>
        {renderTime(time)}
        <div class='flex items-end'>
          <div class={tw(userCls, 'mr-2')}>{player.name.slice(0, 1)}</div>
          <div class='py-1'>
            {player.name} played <b>{itemName}</b>
          </div>
        </div>
      </div>
    );
  };

  const onMessageSelect = (e: MessageAction) =>
    selectedMessage.value = selectedMessage.value === e.id ? undefined : e.id;

  const renderMessages = (time: number, { author, messages }: MessageGroup) => (
    <div class='my-2'>
      {renderTime(time)}
      {author !== authUser.id
        ? (
          <div class='flex items-end'>
            <div class={tw(userCls, 'mr-2')}>
              {author.slice(0, 1)}
            </div>
            <div class='flex(& col) items-start gap-0.5'>
              {messages.map((e) => (
                <div class={tw(messageCls, 'bg-gray-200')}>
                  {e.message.attachments?.map((attachment) => renderAttachment(attachment))}
                  {e.message.message}
                </div>
              ))}
            </div>
          </div>
        )
        : (
          <div class='flex flex-row-reverse'>
            <div class='flex(& col) items-end gap-0.5'>
              {messages.map((e) => (
                <div
                  class={tw(messageCls, 'bg-blue-300 relative')}
                  onClick={() => onMessageSelect(e)}
                >
                  {e.message.attachments?.map((attachment) => renderAttachment(attachment))}
                  {e.message.message}
                  {e.id && selectedMessage.value === e.id
                    ? (
                      <div
                        class={tw`absolute right-[75%] -top-[75%] py-2 px-4 opacity-80 bg-black text-white rounded-t-2xl rounded-bl-2xl`}
                        onClick={() => removeMessage(group, e.id!)}
                      >
                        Remove
                      </div>
                    )
                    : undefined}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );

  const taggedPlayers = useComputed(() => {
    const prefix = chatWindow.text.value.match(/@(\S*)$/)?.[1];
    if (!prefix || prefix.length < 1) {
      return;
    }
    return players.filter((player) =>
      player.name.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase())
    );
  });

  const insertPlayer = (player: Profile) => {
    const text = chatWindow.text.value;
    chatWindow.text.value = `${text.slice(0, text.lastIndexOf('@'))}${player.name} `;
    inputRef.current?.focus();
  };

  const onKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && taggedPlayers.value?.length === 1) {
      insertPlayer(taggedPlayers.value[0]);
      e.preventDefault();
    }
  };

  const onInput = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    chatWindow.text.value = e.currentTarget.value;
  };

  const gameMenuVisible = useSignal(false);
  const toggleGameMenu = () => gameMenuVisible.value = !gameMenuVisible.value;

  const clearAttachment = () =>
    batch(() => {
      chatWindow.item.value = null;
      chatWindow.text.value = '';
    });

  return (
    <div class='flex(& 1 col) overflow-hidden bg-white text-black text-center'>
      {/* ROUND IS ACTIVE - PLAYER LIST AND WIDGETS */}
      {
        /* {game && (
        <div class='mt-1'>
          {round
            ? (
              <div>
                Playing <i>{game.rules.name}</i>
              </div>
            )
            : (
              <div>
                Waiting to start <i>{game.rules.name}</i>
              </div>
            )}
          {playerList.map((player) => (
            <div class='flex items-center my-1 px-2'>
              <div class='flex(& 1) items-center'>
                <img class='w-8 h-8 rounded-full mr-2' src={player.img} />
                <div class=''>{player.name}</div>
              </div>
              {round && config && player.player
                ? (
                  <PlayerWidgets
                    ref={round.ref}
                    config={config}
                    playerId={player.id}
                    player={player.player}
                  />
                )
                : null}
            </div>
          ))}
          {canStartRound ? <button>Start round</button> : null}
        </div>
      )}
      {game && <hr class='mt-1' />} */
      }

      <div class='flex flex-col-reverse flex-1 overflow-scroll px-2'>
        {events.map((e) =>
          e.messageGroup
            ? renderMessages(e.time, e.messageGroup)
            : 'transaction' in e && e.transaction
            ? renderTransaction(e.time, e.transaction)
            : null
        )}
      </div>

      <hr class='mb-1' />

      {taggedPlayers.value
        ? (
          <div class='flex(& wrap) p-2'>
            {taggedPlayers.value?.map((player) => (
              <div
                class='px-2 py-0.5 rounded-full bg-gray-300'
                onClick={() => insertPlayer(player)}
              >
                {player.name}
              </div>
            ))}
          </div>
        )
        : null}

      {chatWindow.item.value
        ? (
          <div class='m-2 flex gap-2 items-center justify-center'>
            {renderAttachment(chatWindow.item.value)}
            <XMarkIcon className='w-6' onClick={clearAttachment} />
          </div>
        )
        : null}

      {/* Input */}
      <div class='flex mt-1 pb-2'>
        <button class='px-2 focus:outline-none' onClick={toggleGameMenu}>
          <EllipsisVerticalIcon className='w-6' />
        </button>

        <form class='flex(& 1)' onSubmit={sendMessage}>
          <input
            class='w-full flex-1 py-2 px-4 bg-gray-100 rounded-full outline-none'
            type='text'
            autoComplete='off'
            name='message'
            placeholder='Aa'
            ref={inputRef}
            value={chatWindow.text.value}
            onKeyDown={onKeyDown}
            onChange={onInput}
          />
          <button class='px-2 cursor-pointer' type='submit'>
            <PaperAirplaneIcon className='w-6' />
          </button>
        </form>
      </div>

      <QuickActions {...{ group }} visible={gameMenuVisible} />
    </div>
  );
}
