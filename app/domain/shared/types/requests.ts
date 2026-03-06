import { AllExcept } from '../relations.js'
import { DomainPageQuery } from './page.js'
import { ResourceName } from './resources.js'

export type HttpPageRequest<T extends object, R extends ResourceName> = Omit<
  DomainPageQuery<T>,
  'filters'
> & {
  include?: AllExcept<R>[]
}
