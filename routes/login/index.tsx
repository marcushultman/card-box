import { tw } from 'twind';
import { Handlers } from '$fresh/server.ts';
import { setCookie } from '@std/http/cookie.ts';
import { createTokens } from '../../utils/key.ts';
import db from '@firestore';
import { doc, DocumentSnapshot, getDoc } from 'firebase/firestore';
import LoginEmail from '../../islands/LoginEmail.tsx';
import LoginGoogle from '../../islands/LoginGoogle.tsx';
import getGoogleProfile from '../../utils/google_id.ts';
import { updateProfile } from '../../utils/loading_v2.ts';
import { EnvelopeIcon } from '../../utils/icons/24/outline.ts';

const redirectToLogin = (req: Request, error = 1000) =>
  Response.redirect(new URL(`/login?error=${error}`, req.url));

async function findUserId(data: FormData) {
  const userid = data.get('userid') as string | null;
  const token = data.get('token') as string | null;

  if (userid) {
    // todo: verify credentials
    const snapshot: DocumentSnapshot = await getDoc(doc(db, 'users', userid));
    if (snapshot.exists()) {
      return userid;
    }
  } else if (token) {
    const profile = await getGoogleProfile(token);
    if (profile) {
      await updateProfile(profile.id, profile);
      return profile.id;
    }
  }
  return new Error();
}

export const handler: Handlers = {
  async POST(req, _) {
    const data = await req.formData();
    const uid = await findUserId(data);

    if (uid instanceof Error) {
      uid.message;
      return redirectToLogin(req, 400);
      // return redirectToLogin(req, 403); - login error
      // return redirectToLogin(req, 404); - not found
    }

    const { gjwt, gjwtexp, jwt, jwtexp } = await createTokens(uid);

    const res = Response.redirect(new URL('/', req.url));
    const headers = new Headers(res.headers);

    setCookie(headers, { name: 'gjwt', value: gjwt, expires: gjwtexp });
    setCookie(headers, { name: 'jwt', value: jwt, expires: jwtexp });

    const { status, statusText } = res;
    return new Response(null, { status, statusText, headers });
  },
};

export default function () {
  return (
    <div class='flex(& col) gap-2 items-center'>
      <p class='mt-16 mb-6 text-center'>
        [Card-Box]
      </p>

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

      <a class='w-48 flex items-center text(sm gray-600) py-2 shadow' href='/login/email'>
        <EnvelopeIcon className={tw`w-6 h-6 ml-2 mr-4`} />
        Sign in with Email
      </a>
      <LoginGoogle />

      <a class='mt-2 w-48 text(sm blue-500 center) py-2' href='/signup'>Create an account</a>
    </div>
  );
}
