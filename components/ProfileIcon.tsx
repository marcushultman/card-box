import { JSX } from 'preact';

interface Props extends JSX.HTMLAttributes<HTMLAnchorElement> {
  id: string;
  img: string;
}

export function ProfileIcon({ id, img, ...props }: Props) {
  return (
    <a href={`/users/${id}`} {...props}>
      <img class='w-12 h-12 rounded-full' src={img} alt={id} />
    </a>
  );
}
