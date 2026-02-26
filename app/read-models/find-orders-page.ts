import { secondsToUnixMs } from '#app/lib/utils/time.js'
import { FindPageArgs } from '#app/repos/_shared/types.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { orderRepo } from '#app/repos/order.repo.js'
import { OrderCore } from '#app/domain/order/types.js'

export async function findPage(args: FindPageArgs, opts: { includeCollection?: boolean } = {}) {
  const page = await orderRepo.findPage(args)

  const includeCollection = opts.includeCollection === true

  let keyToCollection = new Map()

  if (includeCollection) {
    const cKeys = page.items.map(o => ({
      chainId: o.chainId,
      address: o.order.collection,
    }))

    const collections = await nftCollectionRepo.findByKeys(cKeys)

    keyToCollection = new Map(collections.map(c => [`${c.chainId}:${c.address.toLowerCase()}`, c]))
  }

  const items = page.items.map(record => {
    const collection = includeCollection
      ? (keyToCollection.get(`${record.chainId}:${record.order.collection.toLowerCase()}`) ?? null)
      : undefined

    return {
      id: record._id.toString(),
      chainId: record.chainId,
      ...orderDTO(record.order),
      rawOrder: record.order,
      collectionMeta: collection,
    }
  })

  return {
    ...page,
    items,
  }
}

// todo: start and end must handle bigints
// api protects against huge start / end
// listener may store orders with full on 256 fields, these need to be handled

const orderDTO = (order: OrderCore) => ({
  type: order.side === 0 ? 'ask' : 'bid',
  isCollectionBid: order.isCollectionBid,
  collection: order.collection,
  tokenId: order.tokenId,
  price: order.price,
  currency: order.currency,
  actor: order.actor,
  start: secondsToUnixMs(Number(order.start)),
  end: secondsToUnixMs(Number(order.end)),
})
