import type { ResourceName, ResourceType } from '#app/domain/shared/types/resources.js'
import type { WithIncludes } from '#app/domain/shared/relations.js'

import { toOrderDTO } from '../dtos/order.dto.js'
import { toSettlementDTO } from '../dtos/settlement.dto.js'
import { toNFTCollectionDTO } from '../dtos/nft-collection.dto.js'

export const dtos: { [R in ResourceName]: (x: ResourceType<R>) => any } = {
  settlement: toSettlementDTO,
  order: toOrderDTO,
  nftCollection: toNFTCollectionDTO,
} as const

function callDTO<K extends ResourceName>(key: K, value: ResourceType<K>) {
  return dtos[key](value)
}

export function applyDTOs<R extends ResourceName>(resource: R, page: WithIncludes<R>[]) {
  return page.map(item => {
    // root to dto
    const out = dtos[resource](item)

    // convert included relations and attach
    for (const key of Object.keys(dtos) as (keyof typeof dtos)[]) {
      if (key === resource) continue

      const rel = item[key]
      if (!rel) continue

      out[key] = callDTO(key, rel)
    }

    return out
  })
}
