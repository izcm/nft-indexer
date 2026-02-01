import { erc721Abi, Hex, PublicClient } from 'viem'

export const erc721For = (client: PublicClient) => {
  const abi = erc721Abi

  const readName = (address: Hex) => {
    return client.readContract({
      address,
      abi,
      functionName: 'name',
    })
  }

  const readSymbol = (address: Hex) => {
    return client.readContract({
      address,
      abi,
      functionName: 'symbol',
    })
  }
}
