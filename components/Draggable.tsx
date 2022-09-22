import { JSX } from 'preact';
import { tw } from 'twind';
import { Metadata } from '../utils/rules.ts';

interface Props extends JSX.HTMLAttributes<HTMLElement> {
  invisible: boolean;
  metadata?: Metadata;
}

export function DraggableCard(
  { invisible, metadata, onDragStart, onDragEnd }: Props,
) {
  const cardCls = tw(
    `m-1 w-44 h-64 rounded-lg border-zinc-900 cursor-grab`,
    invisible && 'opacity-30',
  );
  return (
    <img
      class={cardCls}
      src={metadata?.image as string}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  );
}

export function DraggableTurn({ invisible, onDragStart, onDragEnd }: Props) {
  const turnCls = tw(
    `w-14 h-14 rounded-full border(2 zinc-300) text-xs leading-[3rem] cursor-grab`,
    invisible && 'opacity-30',
  );
  return (
    <div class={turnCls} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
      DEALER
    </div>
  );
}
