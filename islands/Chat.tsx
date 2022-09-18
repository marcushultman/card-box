/** @jsx h */
import { h } from 'preact';
import { tw } from '@twind';
import useGame from '../utils/use_game.ts';
import { Action, ChatMessage, ChatMessageType, decorateAction } from '../utils/game_engine.ts';
import { Variants } from '../utils/rules.ts';

interface Props {
  author: string;
  gameId: string;
}

function byTime(lhs: { time: number }, rhs: { time: number }) {
  return lhs.time - rhs.time;
}

function isAction(e: ChatMessage | Action): e is Action {
  return 'item' in e;
}

export default function Chat(
  { author, gameId }: Props,
) {
  const { game, addChatMessage, addSystemMessage } = useGame(gameId);

  if (!game) {
    return <div></div>;
  }

  const onSubmit = (e: h.JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get('message');
    if (typeof message === 'string' && message.length) {
      addChatMessage(author, message);
      form.reset();
    }
  };

  type Event = Action | ChatMessage;

  const shouldCombine = (group: Event[], rhs: Event) => {
    const lhs = group[group.length - 1];
    return isAction(lhs) === isAction(rhs) && lhs.author === rhs.author &&
      rhs.time - lhs.time < 60 * 60 * 1000;
  };

  const events = [...game.messages, ...game.actions].sort(byTime);
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
    <div class={tw`text-sm text-gray-500`}>
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
              <i>{e.author}</i>
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
    <div class={tw`my-2`}>
      {renderTime(group[0].time)}
      {group.map((e) => <div class={tw`italic capitalize`}>🖥:&nbsp;{e.message}</div>)}
    </div>
  );
  const renderChatMessages = (group: ChatMessage[]) => (
    <div class={tw`my-2`}>
      {renderTime(group[0].time)}
      <div class={tw`flex items-end`}>
        <div class={tw`w-8 h-8 leading-8 text-white bg-gray-800 rounded-full`}>
          {group[0].author?.slice(0, 1)}
        </div>
        <div class={tw`mx-2 rounded-lg rounded-bl-none px-2 py-1 bg-gray-200`}>
          {group.map((e) => <div class={tw`text-left`}>{e.message}</div>)}
        </div>
      </div>
    </div>
  );

  const renderMessages = (group: ChatMessage[]) =>
    group[0].type === ChatMessageType.SYSTEM
      ? renderSystemMessage(group)
      : renderChatMessages(group);

  return (
    <div class={tw`flex-column items-stretch gap-2 w-full text-center`}>
      <b class={tw`text-lg`}>Chat:</b>
      <hr></hr>
      {messageGroups.map((group) =>
        isAction(group[0])
          ? renderActions(group as Action[])
          : renderMessages(group as ChatMessage[])
      )}

      <div class={tw`flex items-center`}>
        {templates.map(({ title, action }) => (
          <button
            class={tw`p-2 text-white bg-gray-600 rounded-lg mr-2`}
            onClick={() => action()}
          >
            {title}
          </button>
        ))}

        <form class={tw`flex-1 flex p-1`} onSubmit={onSubmit}>
          <input
            class={tw`w-full flex-1 px-4 mr-2 bg-gray-100 rounded-full outline-none`}
            type='text'
            autoComplete='off'
            name='message'
            placeholder='Aa'
          />
          <input class={tw`p-2 bg-white cursor-pointer`} type='submit' value='✈️' />
        </form>
      </div>
    </div>
  );
}
