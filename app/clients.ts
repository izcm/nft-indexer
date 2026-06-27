import { Chain, createPublicClient, http, PublicClient } from 'viem'
import * as chains from 'viem/chains'

import { loadChainsConfig } from '#app/config/chains.js'

// chain.id !== undefined
export type AppClient = PublicClient<any, Chain>

export type ChainClient = {
  client: AppClient
  marketplaceAddr: `0x${string}`
}

const configs = loadChainsConfig()

export const chainClients: ChainClient[] = configs.map(({ rpcUrl, marketplaceAddr }) => ({
  client: createPublicClient({ transport: http(rpcUrl) }),
  marketplaceAddr,
}))

export const clientsByChainId: Record<number, AppClient> = Object.fromEntries(
  chainClients.map(({ client }) => [client.chain?.id, client])
)

export async function initChainClients(): Promise<ChainClient[]> {
  const configs = loadChainsConfig()

  return Promise.all(
    configs.map(async ({ rpcUrl, marketplaceAddr }) => {
      const client = createPublicClient({ transport: http(rpcUrl) })
      const id = await client.getChainId()

      const chain = Object.values(chains).find(c => (c as Chain).id === id)
      if (!chain) throw new Error(`Unsupported chain id: ${id}`)

      return { client: Object.assign(client, { chain }) as AppClient, marketplaceAddr }
    })
  )
}
