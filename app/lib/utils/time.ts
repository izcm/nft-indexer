export const isUnixSeconds = (ts: number) => {
  Number.isInteger(ts) && ts < 1e11
}
