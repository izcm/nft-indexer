import fs from 'node:fs'
import type { Address } from '#app/domain/shared/types/eth.js'

export type ChainConfig = {
  rpcUrl: string
  marketplaceAddr: Address
}

export function loadChainsConfig(): ChainConfig[] {
  const path = process.env.CHAINS_CONFIG ?? './chains.json'
  const raw = fs.readFileSync(path, 'utf-8')
  return JSON.parse(raw) as ChainConfig[]
}
