import { assert } from '@std/testing/asserts.ts';

export type Truthy<T> = false extends T ? never
  : 0 extends T ? never
  : '' extends T ? never
  : null extends T ? never
  : undefined extends T ? never
  : T;

/*
IfTruthy:
<true, U, V>              U
<true | undefined, U, V>  U | V
<undefined, U, V>         V
*/

type IfTruthy<T, U, V> = unknown extends T ? undefined
  : [T] extends [Truthy<T>] ? U
  : [T] extends [false | 0 | '' | null | undefined] ? V
  : U | V;

type TestU_1 = IfTruthy<true, 'U', 'V'>;
type TestU_2 = IfTruthy<1, 'U', 'V'>;

type TestU_or_V_1 = IfTruthy<true | undefined, 'U', 'V'>;
type TestU_or_V_2 = IfTruthy<true | false, 'U', 'V'>;
type TestU_or_V_3 = IfTruthy<true | null, 'U', 'V'>;
type TestU_or_V_4 = IfTruthy<true | undefined, 'U', 'V'>;

type TestV_1 = IfTruthy<undefined, 'U', 'V'>;
type TestV_2 = IfTruthy<false, 'U', 'V'>;
type TestV_3 = IfTruthy<null, 'U', 'V'>;

type Cb<T, U> = (_: NonNullable<T>) => U;

function isTruthy<T extends null | undefined | unknown>(t: T): t is NonNullable<T> {
  return !!t;
}

// Remap T

export function remap<T, U>(t: T, f: Cb<T, U>): IfTruthy<T, U, undefined>;
export function remap<T, U, V>(t: T, f: Cb<T, U>, v: V): IfTruthy<T, U, V>;
export function remap<T, U, V>(t: T, f: Cb<T, U>, v?: V): IfTruthy<T, U, V> {
  return (isTruthy(t) ? f(t) : v) as never;
}

// Remap T[K]

export function remapField<T, K extends keyof T>(t: T, k: K): IfTruthy<T[K], T[K], undefined>;
export function remapField<T, K extends keyof T, U>(
  t: T,
  k: K,
  f: Cb<T[K], U>,
): IfTruthy<T[K], U, undefined>;
export function remapField<T, K extends keyof T, U, V>(
  t: T,
  k: K,
  f: Cb<T[K], U>,
  v: V,
): IfTruthy<T[K], U, V>;
export function remapField<T, K extends keyof T, U, V>(t: T, k: K, f?: Cb<T[K], U>, v?: V) {
  f = f ?? (() => t[k] as unknown as U);
  return v ? remap(t[k], f!, v) : remap(t[k], f!);
}

// Async

export async function remapAsync<T, K extends keyof T, U>(
  t: T,
  k: K,
  fn: Cb<T[K], Promise<U>>,
): Promise<IfTruthy<T[K], U, undefined>>;
export async function remapAsync<T, K extends keyof T, U, V>(
  t: T,
  k: K,
  fn: Cb<T[K], Promise<U>>,
  orDefault: V,
): Promise<IfTruthy<T[K], U, V>>;
export async function remapAsync<T, K extends keyof T, U, V>(
  t: T,
  k: K,
  fn: Cb<T[K], Promise<U>>,
  orDefault?: V,
) {
  const arg = t[k];
  return (isTruthy(arg) ? await fn(arg) : orDefault) as IfTruthy<T[K], U, V>;
}

export function remapValue<T, U, V, W>(t: IfTruthy<T, U, V>, f: (u: U) => W) {
  return (t ? f(t as U) : (t as V)) as IfTruthy<U, W, V>;
}

if (typeof Deno !== 'undefined') {
  Deno.test('no remap', () => {
    const out = remapField({ foo: 1 } as const, 'foo');
    assert(typeof out === 'number');
    assert(out === 1);
  });

  Deno.test('remap', () => {
    const out = remapField({ foo: 1 } as const, 'foo', (n) => n + 1);
    assert(typeof out === 'number');
    assert(out === 2);
  });

  Deno.test('remap obj', () => {
    const out = remapField({ foo: true }, 'foo', () => ({ bar: 1 }));
    assert(out);
    assert(typeof out.bar === 'number');
  });

  Deno.test('remap obj with default', () => {
    const out = remapField({ foo: true }, 'foo', () => ({ bar: 1 }), {});
    assert('bar' in out);
    assert(typeof out.bar === 'number');
  });

  Deno.test('undefined', () => {
    const out = remapField({ foo: undefined }, 'foo', () => assert(false));
    assert(typeof out === 'undefined');
  });

  Deno.test('default', () => {
    const out = remapField({ foo: undefined }, 'foo', () => assert(false), {});
    assert(typeof out === 'object');
  });

  Deno.test('default primitive', () => {
    const out = remapField({ foo: undefined }, 'foo', () => assert(false), 42);
    assert(typeof out === 'number');
    assert(out === 42);
  });

  Deno.test('false', () => {
    const out = remapField({ foo: false } as const, 'foo', () => assert(false));
    assert(typeof out === 'undefined');
  });

  Deno.test('true', () => {
    const out = remapField({ foo: true } as const, 'foo', (t) => !t);
    assert(typeof out === 'boolean');
    assert(!out);
  });

  Deno.test('success: can spread mapped type', () => {
    const out = { ...remapField({ foo: true }, 'foo', () => ({ bar: 1 })) };
    assert(typeof out === 'object');
    assert(out.bar === 1);
  });

  Deno.test('fail: can spread default', () => {
    const out = { ...remapField({ foo: false }, 'foo', () => assert(false), {}) };
    assert(typeof out === 'object');
    assert(!Object.keys(out).length);
  });

  Deno.test('function: spread ', () => {
    const fn = <T extends { foo: unknown }>(t: T) => remapField(t, 'foo', () => 'bar');
    const out1 = fn({ foo: false });
    const out2 = fn({ foo: true });
    assert(typeof out1 === 'undefined');
    assert(typeof out2 === 'string');
    assert(out2 === 'bar');
  });

  Deno.test('function: unknown', () => {
    const fn = <T extends { foo?: unknown }>(t: T) => remapField(t, 'foo');
    const out = fn({});
    assert(typeof out === 'undefined');
  });

  // Deno.test('function: recursion', () => {
  //   type Rules = { name: 'rules' };
  //   const fn = <WireState extends { rules?: Rules }>(t: WireState) => {
  //     // IfTruthy<WireState["rules"], WireState["rules"], undefined>
  //     let rules1 = remap(t, 'rules');

  //     // IfTruthy<WireState["rules"], true, false>
  //     const a = { rules: remap(t, 'rules', () => true as const, false as const) };
  //     // IfTruthy<IfTruthy<WireState["rules"], true, false>, Rules, undefined>;
  //     const b = { rules: remap(a, 'rules', () => ({ name: 'rules' }) as Rules) };
  //     // IfTruthy<IfTruthy<IfTruthy<WireState["rules"], true, false>, Rules, undefined>, IfTruthy<IfTruthy<WireState["rules"], true, false>, Rules, undefined>, undefined>;
  //     const rules2 = remap(b, 'rules');

  //     // ❌
  //     rules1 = rules2;

  //     return [rules1, rules2] as const;
  //   };

  //   let [a, b] = fn({ rules: { name: 'rules' } });

  //   a = b;
  // });

  Deno.test('nullable input', () => {
    const out = remapField({ foo: undefined as number | undefined }, 'foo', () => true);
    assert(typeof out === 'undefined');
  });

  Deno.test('nullable fallback', () => {
    const out = remapField(
      { foo: undefined },
      'foo',
      () => assert(false),
      undefined as number | undefined,
    );
    assert(typeof out === 'undefined');
  });
}
