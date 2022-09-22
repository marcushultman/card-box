const alg = { name: 'HMAC', hash: 'SHA-512' };
const keyUsages: KeyUsage[] = ['sign', 'verify'];

const raw = new TextEncoder().encode(Deno.env.get('JWT_SECRET') ?? 'debug');
export default await crypto.subtle.importKey('raw', raw, alg, true, keyUsages);
