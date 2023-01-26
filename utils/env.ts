import { assert } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

export default function getEnv(key: string, msg?: string) {
  const val = Deno.env.get(key);
  assert(val, msg);
  return val;
}
