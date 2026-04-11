import type { Address } from '../shared/types/eth.js'

export const APP_NAME = 'dmrkt'
export const APP_VERSION = '0'

export const VERIFYING_CONTRACT: Address = process.env.MARKETPLACE_CONTRACT_ADDR as Address
export const MARKETPLACE_CONTRACT: Address = process.env.MARKETPLACE_CONTRACT_ADDR as Address

export const APP_CHAINS: bigint[] = [31337n]

// block start ts is for demo purposes to avoid backfillworker starting at genesis
export const FORK_START_BLOCK: string | undefined = process.env.FORK_START_BLOCK as Address
