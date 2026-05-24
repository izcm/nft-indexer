# repos/mongo

Mongo repos and their shared utilities.

| File                                     | Description                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `shared/_read.ts` / `_write.ts`          | shared read and write helpers reused across repos                                                                                 |
| `model/field-config.ts`                  | maps domain fields to mongo-specific fields, eg. routing sorting on string field `order.price` to the Decimal128 field `db.price` |
| `shared/pagination/find-page-generic.ts` | generic cursor-paginated `findPage` implementation reused across repos                                                            |
| `model/docs.ts`                          | maps domain models to their denormalized MongoDB document representation                                                          |
| `shared/to-repo-query.ts`                | maps `PageQuery` into the shape expected by `find-page-generic`                                                                   |
