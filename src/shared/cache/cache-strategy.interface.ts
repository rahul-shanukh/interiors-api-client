export interface ICacheStrategy {
  get<T>(key: string): Promise<T | null>;

  set<T>(key: string, value: T, ttl?: number, nx?: boolean): Promise<boolean>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  clear(pattern?: string): Promise<void>;

  increment(key: string, ttl?: number): Promise<number>;
}
