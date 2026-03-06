const bytesN = (n: number) => `0x[a-fA-F0-9]{${n * 2}}`

const SIZE20 = 20
const SIZE32 = 32

const ADDR_BASE = bytesN(SIZE20)
const BYTES32_BASE = bytesN(SIZE32)

// full regexes
export const ADDR_REGEX = `^${ADDR_BASE}$`
export const BYTES32_REGEX = `^${BYTES32_BASE}$`

// composite ids
export const ORDER_ID_REGEX = `^\\d+:${BYTES32_BASE}$`
export const SETTLEMENT_REGEX_ID = `^\\d+:${BYTES32_BASE}$`
export const COLLECTION_ID_REGEX = `^\\d+:${ADDR_BASE}$`
