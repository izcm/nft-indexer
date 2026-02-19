import { FindPageArgs } from '#app/repos/_shared/types.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { orderRepo } from '#app/repos/order.repo.js'

export async function findPage(args: FindPageArgs, opts: { includeCollection?: boolean } = {}) {
  const page = await orderRepo.findPage(args)

  // no further attachments
  if (!opts.includeCollection) return page

  // -- attach collection ---

  // round up nftCollectionKeys chainId + address
  const cKeys = page.items.map(o => ({ chainId: o.chainId, address: o.order.collection }))

  // fetch nft collections in one query
  const collections = await nftCollectionRepo.findByKeys(cKeys)

  // map for more efficient lookup
  const keyToCollection = new Map(
    collections.map(c => [`${c.chainId}:${c.address.toLowerCase()}`, c])
  )

  // lookup
  const items = page.items.map(record => {
    const key = `${record.chainId}:${record.order.collection.toLowerCase()}`
    const collection = keyToCollection.get(key)

    return {
      ...record,
      collection,
    }
  })

  return {
    ...page,
    items,
  }
}
