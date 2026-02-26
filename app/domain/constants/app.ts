import type { Address } from '../shared/eth.js'

export const APP_NAME = 'dmrkt'
export const APP_VERSION = '0'

export const VERIFYING_CONTRACT: Address = process.env.VERIFYING_CONRACT as Address
export const SETTLEMENT_EVENT_EMITTER: Address = process.env.SETTLEMENT_EMITTER as Address

export const APP_CHAINS: bigint[] = [31337n]
