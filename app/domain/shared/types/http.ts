import { DomainPageQuery } from './page.js'
import { ResourceName } from './resources.js'

export type HttpPageRequest<T extends object> = Omit<DomainPageQuery<T>, 'filters'> & {
  include?: ResourceName[]
}
