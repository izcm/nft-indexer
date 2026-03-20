import { parseAbiItem, zeroAddress } from 'viem'

import { AppClient } from '#app/clients.js'

import { DEFAULT_WORKER_LIMIT } from '#app/domain/constants/limits.js'
import { NFTCollectionPort } from '#app/domain/nft-collection/port.js'
import { NFTPort } from '#app/domain/nft/port.js'

const STEP = 9n // rpc free tier restriction
const MAX_STEPS = 1000

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
)

type BackfillPort = {
  findBackfillNotDone: NFTCollectionPort['findBackfillNotDone']
  updateLastScannedBlock: NFTCollectionPort['updateLastScannedBlock']
  ensureNFT: NFTPort['ensure']
}

export async function runNFTBackfillWorker(client: AppClient, port: BackfillPort) {
  const chainId = client.chain.id

  const collections = await port.findBackfillNotDone(chainId, DEFAULT_WORKER_LIMIT)
  const latest = await client.getBlockNumber()

  for (const c of collections) {
    // let from = BigInt(c.lastScannedBlock ?? 24480751)
    let from = 24495448n // todo: remove this

    // logs in span from => to
    // action categorized as`mint:
    //  - event = TRANSFER_EVENT (filters on hash of TRANSFER_EVENT signature)
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

        await port.ensureNFT({ chainId, collection: c.address, tokenId: tokenId.toString() }, block)

        await port.updateLastScannedBlock({ chainId, address: c.address, block })
      }

      // the returned logs keep
      from = to + 1n

      step++
    }
  }
}
