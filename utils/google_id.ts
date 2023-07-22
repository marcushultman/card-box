import { decode, verify } from 'djwt';
import { Profile } from './model_v2.ts';
import getEnv from './env.ts';

const PROJECT_ID = getEnv('FIREBASE_PROJECT_ID');

const ALGORITHM = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
const ISSUER = `https://securetoken.google.com/${PROJECT_ID}`;

type GoogleJWK = JsonWebKey & { kid: string };

async function fetchPublicKeys(): Promise<GoogleJWK[]> {
  if (Deno.env.has('GOOGLE_PROFILE_PUB_KEY_JWK')) {
    return JSON.parse(Deno.env.get('GOOGLE_PROFILE_PUB_KEY_JWK')!).keys;
  }
  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com',
  );
  const { keys } = await res.json();
  // todo: cache for res.headers.get('Cache-Control max-age')
  return keys;
}

async function fetchJwks() {
  const keys = await fetchPublicKeys();
  return new Map(
    await Promise.all(
      keys.map(async (jwk) =>
        [jwk.kid, await crypto.subtle.importKey('jwk', jwk, ALGORITHM, true, ['verify'])] as const
      ),
    ),
  );
}

const jwks = await fetchJwks();

export default async function getGoogleProfile(jwt: string) {
  const [{ alg, kid }] = decode(jwt) as any;
  const jwk = jwks.get(kid);

  if (alg !== 'RS256' || !jwk) {
    return null;
  }

  const { aud, iss, sub: id, name, email, picture: img } = await verify(jwt, jwk);

  if (id && aud === PROJECT_ID && iss === ISSUER) {
    return {
      id,
      ...name ? { name } : undefined,
      ...email ? { email } : undefined,
      ...img ? { img } : undefined,
    } as Profile;
  }
  return null;
}
