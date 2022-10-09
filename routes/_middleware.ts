import { MiddlewareHandlerContext } from '$fresh/server.ts';
import { deleteCookie, getCookies } from 'https://deno.land/std@0.121.0/http/cookie.ts';
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts';
import key from '../utils/key.ts';

interface State {
  userid: string;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const requestUrl = new URL(req.url);
  const cookies = getCookies(req.headers);

  if ('jwt' in cookies === false) {
    if (requestUrl.pathname !== '/login') {
      return Response.redirect(new URL('/login', requestUrl));
    }
    return ctx.next();
  }

  const jwt = cookies['jwt'];
  try {
    const { userid } = await verify(jwt, key) as { userid: string };
    ctx.state.userid = userid;
  } catch (_: unknown) {
    const res = Response.redirect(new URL('/login', requestUrl));
    const headers = new Headers(res.headers);
    deleteCookie(headers, 'jwt');
    const { body, status, statusText } = res;
    return new Response(body, { status, statusText, headers });
  }

  return ctx.next();
}
