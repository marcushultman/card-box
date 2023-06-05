import { JSX } from 'preact';
import { UserCircleIcon } from '../utils/icons/24/solid.ts';
import { tw } from 'twind';

interface Props extends JSX.HTMLAttributes<HTMLAnchorElement> {
  id: string;
  img?: string;
}

export function ProfileIcon({ id, img, ...props }: Props) {
  return (
    <a href={`/users/${id}`} {...props}>
      {img
        ? <img class='w-10 h-10 rounded-full' src={img} alt={id} />
        : <UserCircleIcon className={tw`w-10 h-10 text-coolGray-400`} />}
    </a>
  );
}
