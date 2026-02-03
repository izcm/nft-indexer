import { Hex, parseAbi, PublicClient } from 'viem'

import { isErc721 } from '#app/lib/blockchain/interfaces/erc165.js'
import { erc721For } from '#app/lib/blockchain/interfaces/erc721.js'

import { NFTCollectionChainMeta } from '#app/domain/types/nft-collection.js'

const totalSupplyAbi = parseAbi(['function totalSupply() view returns (uint256)'])

export const getCollectionMeta = async (
  client: PublicClient,
  address: Hex
): Promise<Partial<NFTCollectionChainMeta>> => {
  const isSupported = await isErc721(client, address)
  if (!isSupported) throw new Error('[meta-worker] unsupported nft collection')

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
