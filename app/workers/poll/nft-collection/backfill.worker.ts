import { parseAbiItem, zeroAddress } from 'viem'

import { AppClient } from '#app/clients.js'

import { DEFAULT_WORKER_LIMIT } from '#app/config/workers.js'
import { FORK_START_BLOCK } from '#app/config/app.js'

import type { NFTCollectionPort } from '#app/domain/nft-collection/port.js'

import { nftActions } from '#app/di/write.js'

import { isFullyMinted } from '#app/lib/blockchain/calls/dnft-fully-minted.js'

const STEP = 2n // rpc free tier restriction
const MAX_STEPS = 500

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
)

type BackfillPort = {
  findBackfillNotDone: NFTCollectionPort['findBackfillNotDone']
  updateLastScannedBlock: NFTCollectionPort['updateLastScannedBlock']
}

export async function runNFTBackfillWorker(client: AppClient, port: BackfillPort) {
  const chainId = client.chain.id

  const collections = await port.findBackfillNotDone(chainId, DEFAULT_WORKER_LIMIT)
  const latest = await client.getBlockNumber()

  for (const c of collections) {
    // line below is for demo purposes only
    const fullyMinted = await isFullyMinted(client, c.address)
    if (!fullyMinted) {
      console.log(`[backfill] skipping ${c.address} — not fully minted yet`)
      return
    }

    let from = BigInt(c.lastScannedBlock ?? FORK_START_BLOCK ?? 0)

    // categorized as`mint`:
    //  - event = TRANSFER_EVENT
    //  - topic 'from' = ZeroAddress

    let step = 0

    while (from < latest && step < MAX_STEPS) {
      let to = from + STEP

      if (to > latest) to = latest

      const logs = await client.getLogs({
        address: c.address,
        event: TRANSFER_EVENT,
        args: {
          from: zeroAddress,
        },
        fromBlock: from,
        toBlock: to,
      })

      // loop returned logs
      for (const log of logs) {
        const { tokenId } = log.args
        if (tokenId === undefined) continue

        const block = Number(log.blockNumber)

        console.log(`[backfill] nft=${tokenId} block=${block}`)

        await nftActions.ingestNFT(
          { chainId, collection: c.address, tokenId: tokenId.toString() },
          block
        )
      }

      // here or
      await port.updateLastScannedBlock({ chainId, address: c.address, block: Number(to) })

      // the returned logs keep
      from = to + 1n

      step++
    }
  }
}
