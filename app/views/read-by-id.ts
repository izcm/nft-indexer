import type { ById } from '#app/domain/shared/interfaces/read-commons.js'
import type { ResourceName, ResourceType } from '#app/domain/shared/types/resources.js'

type ByIdReaders = {
  [K in ResourceName]: ById<ResourceType<K>, any>
}

// todo: id needs to be validated (di?)
export const createReadById = (readers: ByIdReaders) =>
  async function readById<R extends ResourceName>(
    resource: R,
    id: unknown
  ): Promise<ResourceType<R> | null> {
    return readers[resource].findById(id)
  }
