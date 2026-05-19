import type { ByKey } from '#app/domain/shared/interfaces/read-commons.js'
import type { ResourceKey, ResourceName, ResourceType } from '#app/domain/shared/types/resource.js'

import { callDTO } from './shared/apply-dtos.js'

type ByIdReaders = {
  [K in ResourceName]: ByKey<ResourceType<K>, any>
}

export const makeReadOne = (readers: ByIdReaders) =>
  async function readByKey<R extends ResourceName>(
    resource: R,
    key: ResourceKey<R>
  ): Promise<ResourceType<R> | null> {
    const result = await readers[resource].findByKey(key)

    if (!result) return null

    return callDTO(resource, result)
  }
