import { Handlers } from '$fresh/server.ts';
import { deleteCookie } from 'https://deno.land/std@0.121.0/http/cookie.ts';

export const handler: Handlers = {
  GET(req, _) {
    const res = Response.redirect(new URL('/', req.url));
    const headers = new Headers(res.headers);
    deleteCookie(headers, 'jwt');
    const { status, statusText } = res;
    return new Response(null, { status, statusText, headers });
  },
};
