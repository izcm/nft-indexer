import { parseAbiItem, zeroAddress } from 'viem'

import { AppClient } from '#app/clients.js'

import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { nftRepo } from '#app/repos/nft.repo.js'

import type { NFT } from '#app/domain/nft/model.js'
import { Status } from '#app/domain/shared/status.js'

const STEP = 5000n
const MAX_STEPS = 3

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 tokenId)'
)

export async function runNFTBackfillWorker(client: AppClient) {
  const chainId = client.chain.id

  const collections = await nftCollectionRepo.findBackfillNotDone(chainId)
  const latest = await client.getBlockNumber()

  for (const c of collections) {
    const from = BigInt(c.lastScannedBlock ?? 0)

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
        const { to, tokenId } = log.args
        if (tokenId === undefined) continue

        const nft: NFT = {
          chainId,
          collection: c.address,
          tokenId: tokenId.toString(),
          metaStatus: Status.PENDING,
          createdAtBlock: log.blockNumber,
        }

        await nftRepo.ensure(nft)
      }

      // the returned logs keep
      to = to + STEP

      if (to >= latest) to = latest
      step++
    }
  }
}
