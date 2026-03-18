import { parseAbiItem, zeroAddress } from 'viem'

import { DEFAULT_WORKER_LIMIT } from '#app/domain/constants/limits.js'
import { AppClient } from '#app/clients.js'

import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { nftRepo } from '#app/repos/nft.repo.js'

const STEP = 9n
const MAX_STEPS = 1000

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
)

export async function runNFTBackfillWorker(client: AppClient) {
  const chainId = client.chain.id

  const collections = await nftCollectionRepo.findBackfillNotDone(chainId, DEFAULT_WORKER_LIMIT)
  const latest = await client.getBlockNumber()

  for (const c of collections) {
    // let from = BigInt(c.lastScannedBlock ?? 24480751)
    let from = 24480751n // todo: remove this

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
        console.log(log)
        const { tokenId } = log.args
        if (tokenId === undefined) continue

        const something = await nftRepo.ensure(
          { chainId, collection: c.address, tokenId: tokenId.toString() },
          Number(log.blockNumber)
        )
        console.log(something)
      }

      // the returned logs keep
      from = to + 1n

      step++
    }
  }
}
