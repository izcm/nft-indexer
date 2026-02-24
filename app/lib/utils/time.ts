export const isUnixSeconds = (ts: number) => Number.isInteger(ts) && ts < 1e11

export const secondsToUnixMs = (sc: number) => sc * 1000
