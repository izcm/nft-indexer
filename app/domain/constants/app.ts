import { Hex } from 'viem'

export const APP_NAME = 'dmrkt'
export const APP_VERSION = '0'

export const VERIFYING_CONTRACT: Hex = process.env.VERIFYING_CONRACT as Hex
export const SETTLEMENT_EVENT_EMITTER: Hex = process.env.SETTLEMENT_EMITTER as Hex

export const APP_CHAINS: bigint[] = [31337n]

export const DEFAULT_WORKER_LIMIT = 25
