import type { Page, PageQuery } from '../types/page.js'

export interface ByKey<TEntity, TKey> {
  findByKey(key: TKey): Promise<TEntity | null>
  findByKeys(keys: TKey[]): Promise<TEntity[]>
}

export interface Pageable<TEntity extends object> {
  findPage(args: PageQuery): Promise<Page<TEntity>>
}
