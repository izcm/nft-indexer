import { toOrderDTO } from '../orders/dto.js'
import { ResourceName } from './types.js'

export const dtos: Record<ResourceName, (x: any) => any> = {
  settlement: x => x,
  order: toOrderDTO,
  nftCollection: x => x,
} as const

export function applyDTOs(resource: ResourceName, page: Object[]) {
  return page.map(item => {
    // copy
    const out = { ...item }

    for (const key of Object.keys(dtos) as ResourceName[]) {
    }
  })
  for (const item of page) {
    const base = dtos[resource]

    for (const key of Object.keys(dtos) as ResourceName[]) if (item.hasOwnProperty(key)) return
  }
}
