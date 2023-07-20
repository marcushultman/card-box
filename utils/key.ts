import { create, Payload, verify } from 'djwt';
import { importJWK, importPKCS8, JWK } from 'jose';
import getEnv from './env.ts';

const CLIENT_EMAIL = getEnv('FIREBASE_EMAIL');
const PRIVATE_KEY_ID = getEnv('FIREBASE_PRIVATE_KEY_ID');
const PRIVATE_KEY = getEnv('FIREBASE_PRIVATE_KEY_PKCS8');

const ALGORITHM = 'RS256';
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
  type GoogleJWK = JWK & { kid: string };
  const { keys }: { keys: GoogleJWK[] } = await res.json();
  return keys.find(({ kid }) => kid === PRIVATE_KEY_ID)!;
}

const signKey = await importPKCS8(PRIVATE_KEY, ALGORITHM) as CryptoKey;
const verifyKey = await importJWK(await fetchPublicKey(), ALGORITHM) as CryptoKey;

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
    console.log('[verifyToken] jwt:', jwt);
    const { uid } = await verify(jwt, verifyKey) as { uid: string };
    console.log('[verifyToken] OK uid:', uid);
    return uid;
  } catch (err: unknown) {
    console.error('[verifyToken] ERROR:', err);
    return;
  }
}
