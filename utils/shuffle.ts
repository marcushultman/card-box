import Random from './random.ts';

export default function <T>(arr: T[], random: Random) {
  let i = arr.length, j;

  while (i > 0) {
    j = Math.floor(random.next() * i--);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
