import { ComponentChild, ComponentChildren, Fragment, JSX, VNode } from 'preact';
import { tw } from 'twind';
import { uw } from '../utils/preact/twind.ts';

export interface Props extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string | VNode<unknown>;
}

export function TopBarAnchor({ ...props }: JSX.HTMLAttributes<HTMLAnchorElement>) {
  return <a class='group w-10 p-2' {...props} />;
}
export { TopBarAnchor as TopBarAction };

export function TopBarButton({ ...props }: JSX.HTMLAttributes<HTMLButtonElement>) {
  return <button class='group w-10 p-2' {...props} />;
}

export default function TopBar({ title, children, className, ...props }: Props) {
  const isFragment = (child: ComponentChildren | unknown) => {
    return !!child && typeof child === 'object' && 'type' in child && child.type === Fragment;
  };

  const [left, right, ...rest] = [children].flat().map((c) => isFragment(c) ? undefined : c);

  const makeTitleEl = (marginLeft = false, marginRight = false) => {
    const cls = tw(!marginLeft || 'ml-10', !marginRight || 'mr-10');
    return <div class={tw(cls, 'flex-1 text-center')}>{title}</div>;
  };
  return (
    <>
      <div class={tw(uw(className), 'h-10 flex items-center m-2')} {...props}>
        {[left, children ? makeTitleEl(!left, !right) : makeTitleEl(), right]}
      </div>
      {rest}
      <hr class='mb-2' />
    </>
  );
}
