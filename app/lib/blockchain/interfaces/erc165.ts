import { Hex, parseAbi, PublicClient } from 'viem'

// ERC-165 ABI
const abi = parseAbi(['function supportsInterface(bytes4 interfaceId) view returns (bool)'])

export const isErc721 = async (client: PublicClient, address: Hex) =>
  supportsInterface(client, address, '0x80ac58cd')

export const isDNFT = async (client: PublicClient, address: Hex) =>
  supportsInterface(client, address, '0x6a1c69c8')

function supportsInterface(client: PublicClient, address: Hex, interfaceId: Hex) {
  return client.readContract({
    address,
    abi,
    functionName: 'supportsInterface',
    args: [interfaceId],
  })
}
