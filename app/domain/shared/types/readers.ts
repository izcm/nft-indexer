import type { ById, ByKey, Pageable } from '../interfaces/read-commons.js'
import { ResourceName, ResourceType } from './resources.js'

export type Reader<R extends ResourceName> = ById<ResourceType<R>, any> &
  ByKey<ResourceType<R>, any> &
  Pageable<ResourceType<R>>

export type Readers = {
  [K in ResourceName]: Reader<K>
}

export type PageableKeyReaders = {
  [R in ResourceName]: Pageable<ResourceType<R>> & ByKey<ResourceType<R>, any>
}
