export const Status = {
  DONE: 'DONE',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
} as const

export type Status = (typeof Status)[keyof typeof Status]
