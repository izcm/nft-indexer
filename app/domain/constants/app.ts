import type { Address } from '../shared/types/eth.js'

export const APP_NAME = 'dmrkt'
export const APP_VERSION = '0'
export const APP_CHAINS: bigint[] = [31337n]

export const MARKETPLACE_ADDR: Address = process.env.MARKETPLACE_ADDR as Address

// block start ts is for demo purposes; avoids backfillworker starting at genesis
export const FORK_START_BLOCK: string | undefined = process.env.FORK_START_BLOCK as Address
