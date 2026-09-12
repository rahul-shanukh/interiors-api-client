import { QueryOptions } from "../types/query.types";

export interface DatabaseAdapter {
  create(
    collection: string,
    data: Record<string, unknown>,
  ): Promise<{ id: string; data: Record<string, unknown> }>;
  findById(
    collection: string,
    id: string,
  ): Promise<Record<string, unknown> | null>;
  query(
    collection: string,
    options: QueryOptions,
  ): Promise<Array<{ id: string; data: Record<string, unknown> }>>;
  update(
    collection: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
}
