import { Hex, parseAbi, PublicClient } from 'viem'

// ERC-165 ABI
const abi = parseAbi(['function supportsInterface(bytes4 interfaceId) view returns (bool)'])

export const isErc721 = async (client: PublicClient, address: Hex) => {
  return supportsInterface(client, address, '0x80ac58cd')
}

const supportsInterface = async (client: PublicClient, address: Hex, interfaceId: Hex) => {
  const supports = await client.readContract({
    address,
    abi,
    functionName: 'supportsInterface',
    args: [interfaceId],
  })

  return supports
}
