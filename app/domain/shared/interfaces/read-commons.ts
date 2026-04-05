import type { Page, DomainPageQuery } from '../types/page.js'

export interface ByKey<TEntity, TKey> {
  findByKey(key: TKey): Promise<TEntity | null>
  findByKeys(keys: TKey[]): Promise<TEntity[]>
}

export interface Pageable<TEntity extends object> {
  findPage(args: DomainPageQuery): Promise<Page<TEntity>>
}
