import { Handlers } from '$fresh/server.ts';
import { deleteCookie } from '@std/http/cookie.ts';

export const handler: Handlers = {
  GET(req, _) {
    const res = Response.redirect(new URL('/', req.url));
    const headers = new Headers(res.headers);
    deleteCookie(headers, 'jwt');
    const { status, statusText } = res;
    return new Response(null, { status, statusText, headers });
  },
};
