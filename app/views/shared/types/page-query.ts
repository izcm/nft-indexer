import { PageWindow } from '#app/repos/shared/types.js'
import { ResourceName } from '#app/views/shared/types/resource-defs.js'

export type PageQuery = PageWindow & {
  include?: ResourceName[]
} & Record<string, unknown>
