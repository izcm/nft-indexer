import { FindPageArgs } from '../pagination/types.js'

export interface ByKeyRepository<TEntity, TKey> {
  findByKey(key: any): Promise<TEntity | null>
  findByKeys(key: any[]): Promise<TEntity[] | null>
}

export interface ByIdRepository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>
}

export interface PageableRepository<TEntity> {
  findPage(args: FindPageArgs): Promise<{ items: TEntity[]; nextCursor: string | null }>
}
