const decoder = new TextDecoder();
const gid = Array(8).fill(0);

export default class Random {
  constructor(private seed: number) {}

  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  nextGid() {
    return btoa(decoder.decode(new Uint8Array(gid.map(() => Math.floor(128 * this.next())))));
  }
}
