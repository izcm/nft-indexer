import { AppClient } from '#app/clients.js'
import { Address, Hex, parseAbi } from 'viem'
import { supportsInterface } from '../interfaces/erc165.js'

// NOT FOR PRODUCTION - DEMO ONLY

/**
 * Securing demo pipeline runs smooth, this worker checks that demo nft collection is fully minted
 *
 *  1. checks if contract suports the DNFT interface
 *  2. if interface is supported (which it should since this is only for demo)
 *      - check if totalSupply == MAX_SUPPLY
 *      - yes ? start running backfill-worker : hault backfill-worker
 */

export const DNFT_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
])

const DNFT_INTERFACE_ID: Hex = '0x6a1c69c8'

function key(chainId: number, address: string) {
  return `${chainId}:${address}`
}

// DNFT support is an immutable property of a deployed contract, safe to cache forever (unlike fullyMinted, below)
const dnftCache = new Map<string, boolean>()

export async function isDNFT(client: AppClient, address: Address) {
  const chainId = client.chain.id
  const cacheKey = key(chainId, address)

  const cached = dnftCache.get(cacheKey)
  if (cached !== undefined) return cached

  const supported = await supportsInterface(client, address, DNFT_INTERFACE_ID)
  dnftCache.set(cacheKey, supported)

  return supported
}

const fullyMintedCache = new Set<string>()

export async function isFullyMinted(client: AppClient, address: Address) {
  const chainId = client.chain.id

  if (!(await isDNFT(client, address))) throw new Error(`${address} does not implement DNFT`)

  if (fullyMintedCache.has(key(chainId, address))) return true

  const [total, max] = await Promise.all([
    client.readContract({
      address,
      abi: DNFT_ABI,
      functionName: 'totalSupply',
    }),
    client.readContract({
      address,
      abi: DNFT_ABI,
      functionName: 'MAX_SUPPLY',
    }),
  ])

  const isFullyMinted = total === max

  if (isFullyMinted) fullyMintedCache.add(key(chainId, address))

  return isFullyMinted
}
