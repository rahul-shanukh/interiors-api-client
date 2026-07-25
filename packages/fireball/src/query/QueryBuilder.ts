import { MetadataReader } from "../metadata/MetadataReader";
import { FireballEngine } from "../core/FireballEngine";
import {
  WhereClause,
  OrderByClause,
  WhereOperator,
  QueryOptions,
} from "../types/query.types";

export class QueryBuilder<T> {
  private options: QueryOptions = { where: [], orderBy: [] };

  constructor(private modelClass: Function) {}

  where(field: string, operator: WhereOperator, value: unknown): this {
    this.options.where.push({ field, operator, value } as WhereClause);
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): this {
    this.options.orderBy.push({ field, direction } as OrderByClause);
    return this;
  }

  limit(count: number): this {
    this.options.limitCount = count;
    return this;
  }

  async exec(): Promise<Array<{ id: string } & Record<string, unknown>>> {
    const blueprint = MetadataReader.getBlueprint(this.modelClass);
    const adapter = FireballEngine.getAdapter();
    const collectionName = blueprint.collection!.name;

    // Auto-exclude soft-deleted docs unless caller explicitly queries deletedAt themselves
    if (blueprint.collection?.options.softDelete) {
      const alreadyFiltersDeletedAt = this.options.where.some(
        (w) => w.field === "deletedAt",
      );
      if (!alreadyFiltersDeletedAt) {
        this.options.where.push({
          field: "deletedAt",
          operator: "==",
          value: null,
        });
      }
    }

    const results = await adapter.query(collectionName, this.options);
    return results.map((r) => ({ id: r.id, ...r.data }));
  }

  then<
    TResult1 = Array<{ id: string } & Record<string, unknown>>,
    TResult2 = never,
  >(
    onFulfilled?:
      | ((
          value: Array<{ id: string } & Record<string, unknown>>,
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onFulfilled, onRejected);
  }
}
