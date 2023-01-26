import { Handlers, PageProps } from '$fresh/server.ts';
import LoginEmail, { SIGN_IN_PARAM } from '../../islands/LoginEmail.tsx';
import LoginEmailLink from '../../islands/LoginEmailLink.tsx';
import { ArrowLeftIcon } from '../../utils/icons/24/outline.ts';

interface Data {
  isSignIn: boolean;
}

export const handler: Handlers<Data> = {
  GET(_req, ctx) {
    return ctx.render();
  },
};

export default function ({ url }: PageProps) {
  const isSignIn = url.searchParams.has(SIGN_IN_PARAM);
  const error = url.searchParams.get('error');

  if (isSignIn && !error) {
    return <LoginEmailLink />;
  }
  return (
    <div class='flex(& col)'>
      <div class='flex m-2 items-center'>
        <a class='p-2 w-10 h-10' href='javascript:history.back()'>
          <ArrowLeftIcon className='-z-10' />
        </a>
        <p class='mr-10 flex-1 text-center'>
          [Card-Box]
        </p>
      </div>

      {
        /* <form class='p-4 flex(& col) w-full' method='post'>
        <label for='userid'>Username:</label>
        <input
          type='text'
          id='userid'
          name='userid'
          class='p-1 mb-6 rounded bg-gray-100'
          autoComplete='off'
        />
        <label for='pwd'>Password:</label>
        <input type='password' id='pwd' name='pwd' class='p-1 mb-6 rounded bg-gray-100' />
        <input type='submit' value='Login' class='px-4 py-2 mx-auto rounded-lg bg-green-200' />
      </form> */
      }

      <LoginEmail error={error} />
    </div>
  );
}
