import { toOrderDTO } from '../orders/dto.js'
import { ResourceName } from './types.js'

export const dto: Record<ResourceName, (x: any) => any> = {
  Settlement: () => 'hello',
  Order: toOrderDTO,
  NFTCollection: () => 'hello',
} as const

export function applyDTOs(resource: ResourceName, page: any) {
  for (const item of page) {
    const base = dto[resource]
  }
}
