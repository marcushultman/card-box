import { JSX } from 'preact';

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  userid: string;
}

export function ProfileIcon({ userid, ...props }: Props) {
  return (
    <div {...props}>
      <a href={`/users/${userid}`}>
        <img
          class='w-12 h-12 rounded-full'
          src={`https://via.placeholder.com/64?text=${userid}`}
          alt={userid}
        />
      </a>
    </div>
  );
}
