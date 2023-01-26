import { MiddlewareHandlerContext } from '$fresh/server.ts';
import { deleteCookie, getCookies } from 'https://deno.land/std@0.121.0/http/cookie.ts';
import { AuthState } from '../utils/auth_state.ts';
import { verifyToken } from '../utils/key.ts';

const UNAUTH_RE = [
  /^\/login/,
  /^\/signup$/,
];
const PUBLIC_RE = [
  ...UNAUTH_RE,
  /^\/public\//,
  /^\/_frsh\//,
];

export async function handler(req: Request, ctx: MiddlewareHandlerContext<AuthState>) {
  const requestUrl = new URL(req.url);
  const { jwt, gjwt } = getCookies(req.headers);

  if (!jwt) {
    if (PUBLIC_RE.some((re) => re.test(requestUrl.pathname))) {
      return ctx.next();
    }
    return Response.redirect(new URL('/login', requestUrl));
  } else if (UNAUTH_RE.some((re) => re.test(requestUrl.pathname))) {
    return Response.redirect(new URL('/', requestUrl));
  }

  const uid = await verifyToken(jwt);

  if (!uid) {
    const res = Response.redirect(new URL('/login', requestUrl));
    const headers = new Headers(res.headers);
    deleteCookie(headers, 'jwt');
    const { body, status, statusText } = res;
    return new Response(body, { status, statusText, headers });
  }

  ctx.state.authUser = { id: uid, jwt, gjwt };

  return ctx.next();
}
