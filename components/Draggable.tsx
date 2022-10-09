import { JSX } from 'preact';
import { tw } from 'twind';
import { Metadata } from '../utils/rules.ts';

interface Props<T extends EventTarget> extends JSX.HTMLAttributes<T> {
  invisible?: boolean;
  metadata?: Metadata;
}

export function DraggableCard(
  { invisible, metadata, class: cls, ...props }: Props<HTMLImageElement>,
) {
  const cardCls = tw(
    'm-1 object-fit w-24 h-32 rounded-lg cursor-grab',
    invisible && 'opacity-30',
    cls,
  );
  return (
    <img
      class={cardCls}
      src={metadata?.image as string}
      draggable
      {...props}
    />
  );
}

export function DraggableTurn(
  { invisible, class: cls, ...props }: Props<HTMLDivElement>,
) {
  const turnCls = tw(
    'w-14 h-14 rounded-full border(2 zinc-300) text-xs leading-[3rem] cursor-grab',
    invisible && 'opacity-30',
    cls,
  );
  return <div class={turnCls} draggable {...props}>DEALER</div>;
}
