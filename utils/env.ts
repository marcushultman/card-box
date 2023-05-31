import { assert } from '@std/testing/asserts.ts';

export default function getEnv(key: string, msg?: string) {
  const val = Deno.env.get(key);
  assert(val, msg);
  return val;
}
