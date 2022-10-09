import { h, JSX } from 'preact';
import { tw } from 'twind';
import {
  Action,
  ChatMessage,
  ChatMessageType,
  decorateAction,
  Game,
} from '../utils/game_engine.ts';
import { Variants } from '../utils/rules.ts';

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  userid: string;
  game: Game;
  addChatMessage: (userid: string, message: string) => void;
  visible: boolean;
  offset: number;
}

type Event = Action | ChatMessage;

function byTime(lhs: { time: number }, rhs: { time: number }) {
  return lhs.time - rhs.time;
}

function isAction(e: Event): e is Action {
  return 'item' in e;
}

export default function Chat(
  { userid, game, addChatMessage, visible, offset, ...props }: Props,
) {
  const templateCls = tw`p-2 text-white bg-gray-600 rounded-lg mr-2`;
  const timeCls = tw`text-sm text-gray-500`;
  const userCls = tw`w-8 h-8 leading-8 text-white bg-gray-800 rounded-full`;
  const messageCls = tw`mx-2 rounded-lg rounded-bl-none px-2 py-1 bg-gray-200`;

  const heightZeroCls = tw`max-h-0`;
  const heightAutoCls = tw`max-h-screen`;

  const onSubmit = (e: h.JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get('message');
    if (typeof message === 'string' && message.length) {
      addChatMessage(userid, message);
      form.reset();
    }
  };

  const shouldCombine = (group: Event[], rhs: Event) => {
    const lhs = group[group.length - 1];
    return isAction(lhs) === isAction(rhs) && lhs.userid === rhs.userid &&
      rhs.time - lhs.time < 60 * 60 * 1000;
  };

  const events: Event[] = game.messages.slice();
  if (game.rounds.length) {
    events.push(...game.rounds[game.rounds.length - 1].actions);
  }
  events.sort(byTime);

  const messageGroups = events.reduce((groups, e) => {
    const group = groups[groups.length - 1];
    if (group && shouldCombine(group, e)) {
      (group as unknown[]).push(e);
    } else {
      (groups as unknown[]).push([e]);
    }
    return groups;
  }, [] as (Action[] | ChatMessage[])[]);

  const templates: { title: string; action: () => void }[] = [
    // { title: 'Do this?', action: () => addSystemMessage('do this') },
    // { title: 'Do that?', action: () => addSystemMessage('do that') },
  ];

  const renderTime = (time: number) => (
    <div class={timeCls}>
      {new Date(time).toLocaleString()}
    </div>
  );

  const lookupName = (variants: Variants, key?: string) =>
    key ? variants[key]?.metadata?.name as string | undefined : undefined;

  const renderActions = (group: Action[]) => (
    <div>
      {renderTime(group[0].time)}
      {group.map((e) => {
        const { from, to, item } = decorateAction(game, e);
        const name = lookupName(item.variants, from.itemViews.log) ??
          lookupName(item.variants, from.itemViews.default) ??
          lookupName(item.variants, to.itemViews.default) ??
          item.metadata?.name as string | undefined;
        if (!name) {
          return null;
        }
        return (
          <div>
            <div>
              <i>{e.userid}</i>
              &nbsp;moved&nbsp;
              <i>
                <b>{name}</b>
              </i>
              &nbsp;from <b>{from.repeated?.value} {from.class}</b>
              &nbsp;to <b>{to.repeated?.value} {to.class}</b>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSystemMessage = (group: ChatMessage[]) => (
    <div class='my-2'>
      {renderTime(group[0].time)}
      {group.map((e) => <div class='italic capitalize'>🖥:&nbsp;{e.message}</div>)}
    </div>
  );
  const renderChatMessages = (group: ChatMessage[]) => (
    <div class='my-2'>
      {renderTime(group[0].time)}
      <div class='flex items-end'>
        <div class={userCls}>
          {group[0].userid?.slice(0, 1)}
        </div>
        <div class={messageCls}>
          {group.map((e) => <div class='text-left'>{e.message}</div>)}
        </div>
      </div>
    </div>
  );

  const renderMessages = (group: ChatMessage[]) =>
    group[0].type === ChatMessageType.SYSTEM
      ? renderSystemMessage(group)
      : renderChatMessages(group);

  return (
    <div
      style={{
        boxShadow: '0px -3px 5px -2px rgba(0,0,0,0.25)',
        transform: `translateY(${offset}px)`,
        transition: 'transform 50ms, max-height 200ms ease-in',
      }}
      class={tw(
        'transition-[max-height] duration-200 ease-in',
        visible ? heightAutoCls : heightZeroCls,
        'h-screen flex(& col) justify-end overflow-hidden',
        'flex(& col) bg-white rounded-t-lg items-stretch gap-2 w-full text-center h-[85vh]',
      )}
    >
      <div class='p-2' {...props}>Messages</div>
      <hr></hr>
      <div class='flex-1 overflow-scroll'>
        {messageGroups.map((group) =>
          isAction(group[0])
            ? renderActions(group as Action[])
            : renderMessages(group as ChatMessage[])
        )}
      </div>

      <hr></hr>

      <div class='items-center'>
        {templates.map(({ title, action }) => (
          <button class={templateCls} onClick={() => action()}>
            {title}
          </button>
        ))}
      </div>

      <form class='flex px-1 pb-4' onSubmit={onSubmit}>
        <input
          class='w-full flex-1 px-4 mr-2 bg-gray-100 rounded-full outline-none'
          type='text'
          autoComplete='off'
          name='message'
          placeholder='Aa'
        />
        <input class='p-2 bg-white cursor-pointer' type='submit' value='✈️' />
      </form>
    </div>
  );
}
