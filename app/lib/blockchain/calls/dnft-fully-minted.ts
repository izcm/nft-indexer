import { AppClient } from '#app/clients.js'
import { Address, Hex, parseAbi } from 'viem'
import { isDNFT } from '../interfaces/erc165.js'

// NOT FOR PRODUCTION - DEMO ONLY

/**
 * Securing demo pipeline runs smooth, this worker checks that demo nft collection is fully minted
 *
 *  1. checks if contract suports the DNFT interface
 *  2. if interface is supported (which it should since this is only for demo)
 *      - check if totalSupply == MAX_SUPPLY
 *      - yes ? start running backfill-worker : hault backfill-worker
 */

const DNFT_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
])

const fullyMintedCache = new Set<string>()

function key(chainId: number, address: string) {
  return `${chainId}:${address}`
}

export async function isFullyMinted(client: AppClient, address: Address) {
  const chainId = client.chain.id

  if (!isDNFT(client, address) || fullyMintedCache.has(key(chainId, address))) return true

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
