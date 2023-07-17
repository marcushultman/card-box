import { JSX } from 'preact';
import { UserCircleIcon } from '../utils/icons/24/solid.ts';
import { tw } from 'twind';

interface Props<T extends EventTarget> extends JSX.HTMLAttributes<T> {
  id: string;
  img?: string;
  size?: number;
}

export function ProfileIcon({ id, img, size: maybeSize, ...props }: Props<HTMLDivElement>) {
  const size = maybeSize ?? 10;
  return (
    <div {...props}>
      {img
        ? <img class={`w-${size} h-${size} rounded-full`} src={img} alt={id} />
        : <UserCircleIcon className={tw`w-${size} h-${size} text-coolGray-400`} />}
    </div>
  );
}

export function ProfileLink({ id, img, size: maybeSize, ...props }: Props<HTMLAnchorElement>) {
  const size = maybeSize ?? 10;
  return (
    <a href={`/users/${id}`} {...props}>
      {img
        ? <img class={`w-${size} h-${size} rounded-full`} src={img} alt={id} />
        : <UserCircleIcon className={tw`w-${size} h-${size} text-coolGray-400`} />}
    </a>
  );
}
