import { tw } from 'twind';
import { Handlers, PageProps } from '$fresh/server.ts';
import { setCookie } from '@std/http/cookie.ts';
import { createTokens } from '../../utils/key.ts';
import db from '@firestore';
import { doc, DocumentSnapshot, getDoc } from 'firebase/firestore';
import LoginEmail from '../../islands/LoginEmail.tsx';
import LoginGoogle from '../../islands/LoginGoogle.tsx';
import decodeGoogleProfile from '../../utils/google_id.ts';
import { loadProfile, updateProfile } from '../../utils/loading_v2.ts';
import { EnvelopeIcon } from '../../utils/icons/24/outline.ts';
import { Profile } from '../../utils/model_v2.ts';
import FinishLogin from '../../islands/FinishLogin.tsx';
import { LOGIN_TYPE } from '../../utils/login_constants.ts';
import { urlWithPath } from '../../utils/url.ts';

const redirectToLoginWithError = (req: Request, error = 1000) =>
  Response.redirect(urlWithPath(req.url, '/login', { error: String(error) }));

async function parseLoginRequest(data: FormData) {
  const token = data.get('token');
  return token ? await decodeGoogleProfile(String(token)) : null;
}

async function updateProfileData(profile: Profile) {
  const exisingProfile = await loadProfile(profile.id);
  await updateProfile(profile.id, { ...profile, ...exisingProfile });
}

function searchParamsFromFormData(data: FormData) {
  const params = new URLSearchParams();
  for (const [name, value] of data.entries()) {
    if (typeof value === 'string') {
      params.append(name, value);
    }
  }
  return params;
}

export const handler: Handlers = {
  async POST(req, _) {
    const data = await req.formData();
    const profile = await parseLoginRequest(data);

    if (!profile) {
      return redirectToLoginWithError(req, 400);
    }
    await updateProfileData(profile);

    data.delete('token');
    const res = Response.redirect(urlWithPath(req.url, '/', searchParamsFromFormData(data)));
    const headers = new Headers(res.headers);

    const { gjwt, gjwtexp, jwt, jwtexp } = await createTokens(profile.id);
    setCookie(headers, { name: 'gjwt', value: gjwt, expires: gjwtexp });
    setCookie(headers, { name: 'jwt', value: jwt, expires: jwtexp });

    const { status, statusText } = res;
    return new Response(null, { status, statusText, headers });
  },
};

export default function ({ url }: PageProps) {
  const loginType = url.searchParams.get(LOGIN_TYPE);
  const error = url.searchParams.get('error') ?? undefined;

  if (loginType && !error) {
    return <FinishLogin type={loginType} />;
  }
  return (
    <div class='fixed w-screen h-full flex(& col) gap-2 items-center'>
      <div class='relative w-full h-[80px]'>
        <div class='absolute inset-0 -z-20 border(r([100vw] solid warmGray-600) b([16px] solid transparent))' />
        <div class='absolute inset-0 bottom-4 -z-10 border(r([100vw] solid warmGray-500) b([16px] solid transparent))' />
      </div>

      <div class='mt-36 mb-10 text-center'>
        <div>[Card-Box]</div>
        <div>[Card-Box]</div>
        <div>[Card-Box]</div>
      </div>

      <div class='flex(1 & col) gap-3'>
        <a
          class='w-48 flex items-center text(sm warmGray-500) font-medium py-2 shadow'
          href='/login/email'
        >
          <EnvelopeIcon className={tw`w-6 h-6 ml-2 mr-4`} />
          &nbsp;Sign in with Email
        </a>
        <LoginGoogle />
      </div>

      {error && <div class='text-red-500 mt-2'>{error}</div>}

      <div class='relative w-full h-[80px]'>
        <div class='absolute inset-0 -z-20 border(l([100vw] solid warmGray-600) t([16px] solid transparent))' />
        <div class='absolute inset-0 top-4 -z-10 border(l([100vw] solid warmGray-500) t([16px] solid transparent))' />
      </div>
    </div>
  );
}
