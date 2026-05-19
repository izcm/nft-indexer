import { Chain, createPublicClient, http, PublicClient } from 'viem'
import { loadChainsConfig } from '#app/config/chains.js'

// chain.id !== undefined
export type AppClient = PublicClient<any, Chain>

export type ChainClient = {
  client: AppClient
  marketplaceAddr: `0x${string}`
}

const configs = loadChainsConfig()

export const chainClients: ChainClient[] = configs.map(({ rpcUrl, marketplaceAddr }) => ({
  client: createPublicClient({ transport: http(rpcUrl) }) as AppClient,
  marketplaceAddr,
}))

export const clientsByChainId: Record<number, AppClient> = Object.fromEntries(
  chainClients.map(({ client }) => [client.chain?.id, client])
)
