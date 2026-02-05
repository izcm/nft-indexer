export const isUnixSeconds = (ts: number) => {
  return Number.isInteger(ts) && ts < 1e11
}
