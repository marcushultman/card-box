import { JSX } from 'preact';

type Props = Omit<JSX.HTMLAttributes<HTMLInputElement>, 'type'>;

export default function Switch(props: Props) {
  return (
    <label class='m-2 w-8 h-5 relative'>
      <input
        {...props}
        type='checkbox'
        class='hidden checked:(siblings:(bg-white translate-x-4) sibling:bg(green-500))'
      />
      <span class='absolute transition duration-300 rounded-full w-8 h-5 bg-gray-400 override:override:translate-x-0' />
      <span class='absolute bg-gray-200 transition duration-300 -left-1 -top-0.5 w-6 h-6 rounded-full' />
    </label>
  );
}
