import { Handlers } from '$fresh/server.ts';
import { setCookie } from 'https://deno.land/std@0.121.0/http/cookie.ts';
import { create } from 'https://deno.land/x/djwt@v2.7/mod.ts';
import key from '../utils/key.ts';

export const handler: Handlers = {
  async POST(req, _) {
    const data = await req.formData();
    const username = data.get('username') as string | null;
    const pwd = data.get('pwd');

    const users = new Map(
      (Deno.env.get('ALPHA_USERS') ?? '').split(',').map((u) =>
        u.split(':', 2) as [string, string]
      ),
    );

    if (!username || users.get(username) !== pwd) {
      return Response.redirect(new URL('/login?error=1000', req.url));
    }

    const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { username }, key);

    const res = Response.redirect(new URL('/', req.url));
    const headers = new Headers(res.headers);
    setCookie(headers, {
      name: 'jwt',
      value: jwt,
    });
    const { status, statusText } = res;
    return new Response(null, { status, statusText, headers });
  },
};

export default function login() {
  return (
    <form class='p-4 mx-auto max-w-screen-md h-screen relative flex(& col)' method='post'>
      <p class='my-6 text-center'>
        [Card-Box]
      </p>
      <label for='username'>Username:</label>
      <input
        type='text'
        id='username'
        name='username'
        class='p-1 mb-6 rounded bg-gray-100'
        autoComplete='off'
      />
      <label for='pwd'>Password:</label>
      <input type='password' id='pwd' name='pwd' class='p-1 mb-6 rounded bg-gray-100' />
      <input type='submit' value='Login' class='px-4 py-2 mx-auto rounded-lg bg-green-200' />
    </form>
  );
}
