import { erc721Abi, Hex, PublicClient } from 'viem'

export const erc721For = (client: PublicClient) => ({
  readName(address: Hex) {
    return client.readContract({
      address,
      abi: erc721Abi,
      functionName: 'name',
    })
  },

  readSymbol(address: Hex) {
    return client.readContract({
      address,
      abi: erc721Abi,
      functionName: 'symbol',
    })
  },

  readTokenURI(address: Hex, tokenId: bigint) {
    return client.readContract({
      address,
      abi: erc721Abi,
      args: [tokenId],
      functionName: 'tokenURI',
    })
  },
})
