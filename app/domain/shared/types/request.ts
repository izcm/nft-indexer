import { AllExcept } from '../relations.js'
import { DomainPageQuery } from './page.js'
import { ResourceName } from './resource.js'

export type HttpPageRequest<R extends ResourceName> = Omit<DomainPageQuery, 'filters'> & {
  include?: AllExcept<R>[]
}
