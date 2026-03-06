import type { ByKey } from '#app/domain/shared/interfaces/read-commons.js'
import type { ResourceKey, ResourceName, ResourceType } from '#app/domain/shared/types/resources.js'

type ByIdReaders = {
  [K in ResourceName]: ByKey<ResourceType<K>, any>
}

export const makeReadOne = (readers: ByIdReaders) =>
  function readByKey<R extends ResourceName>(
    resource: R,
    key: ResourceKey<R>
  ): Promise<ResourceType<R> | null> {
    return readers[resource].findByKey(key)
  }
