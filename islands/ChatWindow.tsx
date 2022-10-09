import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { tw } from 'twind';
import Chat from '../components/Chat.tsx';
import useGame from '../utils/use_game.ts';
import { Game } from '../utils/game_engine.ts';
import ChatBubbleLeftIcon from 'https://esm.sh/@heroicons/react@2.0.11/24/outline/ChatBubbleLeftIcon?alias=react:preact/compat';
import ChatBubbleLeftEllipsisIcon from 'https://esm.sh/@heroicons/react@2.0.11/24/outline/ChatBubbleLeftEllipsisIcon?alias=react:preact/compat';

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  userid: string;
  gameId: string;
  game: Game;
}

const touches = new Map<number, number>();

export default function ChatWindow({ class: cls, userid, gameId, game: initGame }: Props) {
  const [visible, setVisible] = useState(false);
  const [offset, setOffset] = useState(0);
  const { game, addChatMessage } = useGame(gameId, initGame);

  const backdropCls = tw`w-screen h-screen bg-[#000000AA]`;

  const onTouchStart = (e: JSX.TargetedTouchEvent<HTMLDivElement>) => {
    if (e.changedTouches.length) {
      const touch = e.changedTouches.item(0)!;
      touches.set(touch.identifier, touch.clientY);
    }
    e.preventDefault();
  };
  const onTouchMove = (e: JSX.TargetedTouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; ++i) {
      const touch = e.changedTouches.item(i)!;
      if (touches.has(touch.identifier)) {
        const startY = touches.get(touch.identifier)!;
        setOffset(Math.max(0, touch.clientY - startY));
        return;
      }
    }
  };
  const onTouchEnd = (e: JSX.TargetedTouchEvent<HTMLDivElement>) => {
    touches.clear();
    if (offset > 100) {
      setVisible(false);
    } else {
      setOffset(0);
    }
  };

  return (
    <div class={cls}>
      <button
        class='text-white leading-2 absolute bottom-4 right-4 w-14 h-14 p-3 bg-blue-400 rounded-full'
        onClick={() => (setVisible(true), setOffset(0))}
      >
        <ChatBubbleLeftIcon />
      </button>

      {visible && <div class={backdropCls} onClick={() => setVisible(false)} />}

      <Chat
        visible={visible}
        offset={offset}
        userid={userid}
        game={game}
        addChatMessage={addChatMessage}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
    </div>
  );
}
