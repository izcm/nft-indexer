import { Hex, parseAbi, PublicClient } from 'viem'
import { erc721For } from '#app/lib/blockchain/interfaces/erc721.js'

import { NFTCollectionChainMeta } from '#app/domain/types/nft-collection.js'

const totalSupplyAbi = parseAbi(['function totalSupply() view returns (uint256)'])

export const readERC721Meta = async (
  client: PublicClient,
  address: Hex
): Promise<Partial<NFTCollectionChainMeta>> => {
  const erc721 = erc721For(client)

  const meta: Partial<NFTCollectionChainMeta> = {
    name: await erc721.readName(address),
    symbol: await erc721.readSymbol(address),
    tokenType: 'ERC721',
  }

  const totalSupplyRaw = await tryTotalSupply(client, address)
  if (totalSupplyRaw !== null) {
    meta.totalSupply = totalSupplyRaw.toString()
  }

  return meta
}

const tryTotalSupply = async (client: PublicClient, address: Hex) => {
  try {
    return await client.readContract({
      address,
      abi: totalSupplyAbi,
      functionName: 'totalSupply',
    })
  } catch {
    return null
  }
}
