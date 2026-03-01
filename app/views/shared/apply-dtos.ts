import { NFTCollection } from '#app/domain/nft-collection/types.js'
import { Settlement } from '#app/domain/settlement/types.js'
import { toOrderDTO } from '../orders/dto.js'
import { ResourceMap, ResourceName, ResourceType } from './types.js'

type DTOMap = {
  [R in keyof ResourceMap]: (x: ResourceType<R>) => any
}

type WithIncludes<R extends ResourceName> = ResourceType<R> & Partial<ResourceMap>

export const dtos: DTOMap = {
  settlement: (x: Settlement) => x,
  order: toOrderDTO,
  nftCollection: (x: NFTCollection) => x,
} as const

function callDTO<K extends ResourceName>(key: K, value: ResourceType<K>) {
  return dtos[key](value)
}

export function applyDTOs<R extends ResourceName>(resource: R, page: WithIncludes<R>[]) {
  return page.map(item => {
    // root to dto
    const out: any = dtos[resource](item)

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
