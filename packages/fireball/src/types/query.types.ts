export type WhereOperator =
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "array-contains"
  | "in"
  | "not-in";

export interface WhereClause {
  field: string;
  operator: WhereOperator;
  value: unknown;
}

export interface OrderByClause {
  field: string;
  direction: "asc" | "desc";
}

export interface QueryOptions {
  where: WhereClause[];
  orderBy: OrderByClause[];
  limitCount?: number;
}
