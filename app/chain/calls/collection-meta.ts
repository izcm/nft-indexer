import { Hex } from 'viem'

import { clientsByChainId } from '#app/chain/clients.js'

export const getCollectionMeta = async (chainId: number, address: Hex) => {
  const client = clientsByChainId[chainId]

  // // check eip-165 supportsInterface
  // const is721 = client.readContract({
  //   address,
  //   abi: ,
  //   functionName: 'supportsInterface',
  //   args: ['0x80ac58cd'],
  // })

  // // todo: move this to some pure logic file
  // if (!is721) {
  //   throw new Error('Error: interface not supported')
  // }

  //   const name =
}
