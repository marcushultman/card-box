export default function <T, S extends string | number | symbol>(arr: T[], by: (t: T) => S) {
  return arr.reduce((rec, t) => {
    const key = by(t);
    (rec[key] = rec[key] ?? []).push(t);
    return rec;
  }, {} as Record<S, T[]>);
}
