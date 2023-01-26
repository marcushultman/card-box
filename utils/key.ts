import { decode } from 'https://deno.land/std@0.165.0/encoding/base64.ts';
import { create, Payload, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';
import getEnv from './env.ts';

const CLIENT_EMAIL = getEnv('FIREBASE_EMAIL');
const PRIVATE_KEY = decode(getEnv('FIREBASE_PRIVATE_KEY'));
const PRIVATE_KEY_ID = getEnv('FIREBASE_PRIVATE_KEY_ID');

const ALGORITHM = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
const CLAIMS: Payload = {
  iss: CLIENT_EMAIL,
  sub: CLIENT_EMAIL,
  aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
};

const ONE_HOUR = 60 * 60;
const ONE_YEAR = 365 * 24 * ONE_HOUR;

// todo: refresh when needed
async function fetchPublicKey() {
  const res = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/' + CLIENT_EMAIL,
  );
  type GoogleJWK = JsonWebKey & { kid: string };
  const { keys }: { keys: GoogleJWK[] } = await res.json();
  return keys.find(({ kid }) => kid === PRIVATE_KEY_ID)!;
}

const signKey = await crypto.subtle.importKey('pkcs8', PRIVATE_KEY, ALGORITHM, true, ['sign']);
const verifyKey = await crypto.subtle.importKey('jwk', await fetchPublicKey(), ALGORITHM, true, [
  'verify',
]);

// Public API

export async function createTokens(uid: string) {
  const alg = 'RS256';
  const iat = Date.now() / 1000;
  const [gjwt, jwt] = await Promise.all([
    create({ alg }, { ...CLAIMS, iat, exp: iat + ONE_HOUR, uid }, signKey),
    create({ alg }, { ...CLAIMS, iat, exp: iat + ONE_YEAR, uid }, signKey),
  ]);
  const gjwtexp = new Date((iat + ONE_HOUR) * 1000);
  const jwtexp = new Date((iat + ONE_YEAR) * 1000);
  return { gjwt, gjwtexp, jwt, jwtexp };
}

export async function verifyToken(jwt: string) {
  try {
    const { uid } = await verify(jwt, verifyKey) as { uid: string };
    return uid;
  } catch (_: unknown) {
    return;
  }
}
