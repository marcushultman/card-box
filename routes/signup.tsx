import { Handlers } from '$fresh/server.ts';
import { setCookie } from '@std/http/cookie.ts';
import { createTokens } from '../utils/key.ts';
import db from '@firestore';
import { doc, DocumentSnapshot, getDoc } from 'firebase/firestore';
import LoginEmail from '../islands/LoginEmail.tsx';
import Signup from '../islands/Signup.tsx';
import getGoogleProfile from '../utils/google_id.ts';
import { ArrowLeftIcon } from '../utils/icons/24/outline.ts';

const redirectToLogin = (req: Request, error = 1000) =>
  Response.redirect(new URL(`/login?error=${error}`, req.url));

export const handler: Handlers = {
  async POST(req, _) {
    const data = await req.formData();

    console.log({ data });

    return redirectToLogin(req, 400);

    // const uid = await findUserId(data);

    // if (uid instanceof Error) {
    //   uid.message;
    //   return redirectToLogin(req, 400);
    //   // return redirectToLogin(req, 403); - login error
    //   // return redirectToLogin(req, 404); - not found
    // }

    // const { gjwt, gjwtexp, jwt, jwtexp } = await createTokens(uid);

    // const res = Response.redirect(new URL('/', req.url));
    // const headers = new Headers(res.headers);

    // setCookie(headers, { name: 'gjwt', value: gjwt, expires: gjwtexp });
    // setCookie(headers, { name: 'jwt', value: jwt, expires: jwtexp });

    // const { status, statusText } = res;
    // return new Response(null, { status, statusText, headers });
  },
};

export default function () {
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

      <Signup />
    </div>
  );
}
