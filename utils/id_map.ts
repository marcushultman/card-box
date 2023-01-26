export default function <T extends { id: string }>(arr: T[]) {
  return Object.fromEntries(arr.map((t) => [t.id, t]));
}
