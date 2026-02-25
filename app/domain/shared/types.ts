export const Status = {
  DONE: 'DONE',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
} as const

export type Status = (typeof Status)[keyof typeof Status]

export type Address = `0x${string}`
export type Hash = `0x${string}`
