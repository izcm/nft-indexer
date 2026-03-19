import type { AppClient } from '#app/clients.js'
import { erc721For } from '#app/lib/blockchain/interfaces/erc721.js'

import { DEFAULT_WORKER_LIMIT } from '#app/domain/constants/limits.js'
import type { NFTPort } from '#app/domain/nft/port.js'

import { parseTokenUri } from './logic.js'

type MetaPort = {
  findPendingMeta: NFTPort['findPendingMeta']
  finalizeMeta: NFTPort['finalizeMeta']
  markMetaFailed: NFTPort['markMetaFailed']
}

export async function runNFTMetaWorker(client: AppClient, port: MetaPort) {
  const pending = await port.findPendingMeta(client.chain.id, DEFAULT_WORKER_LIMIT)

  for (const nft of pending) {
    const { chainId, collection, tokenId } = nft

    try {
      console.log(`getting meta of this stuff`)
      const tokenUri = await erc721For(client).readTokenURI(collection, BigInt(tokenId))

      const meta = parseTokenUri(tokenUri)
      if (!meta) {
        await port.markMetaFailed({
          chainId,
          collection,
          tokenId,
          error: 'failed to parse tokenUri',
        })
        continue
      }

      await port.finalizeMeta({ chainId, collection, tokenId, meta })
    } catch (err) {
      await port.markMetaFailed({
        chainId,
        collection,
        tokenId,
        error: `failed to fetch tokenUri`,
      })
    }
  }
}
