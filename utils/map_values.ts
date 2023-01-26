export default function mapValues<V, U>(m: Record<string, V>, f: (v: V) => U) {
  return Object.fromEntries(Object.entries<V>(m).map(([k, v]) => [k, f(v)]));
}
