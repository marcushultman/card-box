import { JSX } from 'preact';
import { tw } from 'twind';

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  small?: boolean;
  unread?: number;
  tooltip?: string;
}

function Tooltip({ text }: { text: string }) {
  return (
    <div class='absolute top-1/2 -translate-x-full -translate-y-1/2 pr-2'>
      <div class='px-2 py-0.5 rounded-lg text-sm font-light bg(black opacity-60) whitespace-nowrap'>
        {text}
      </div>
    </div>
  );
}

export function ActionButton({ small, unread, tooltip, children, className, ...props }: Props) {
  const size = small ? 10 : 14;
  const padding = small ? 'p-2' : 'p-3';

  const cls = `block w-${size} h-${size} ${padding} bg-blue-400 rounded-full focus:outline-none`;
  const unreadCls = 'absolute top-0 left-0 w-5 h-5 bg-red-600 rounded-full text-sm';

  return (
    <div class={tw('relative', className)}>
      {tooltip ? <Tooltip text={tooltip} /> : null}
      <button className={tw(cls)} {...props}>
        {children}
        {unread ? <div class={unreadCls}>{unread}</div> : null}
      </button>
    </div>
  );
}
