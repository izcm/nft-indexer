import type { ByKey, Pageable } from '../interfaces/read-commons.js'
import { ResourceName, ResourceType } from './resources.js'

export type Reader<R extends ResourceName> = ByKey<ResourceType<R>, any> & Pageable<ResourceType<R>>

export type Readers = {
  [K in ResourceName]: Reader<K>
}
