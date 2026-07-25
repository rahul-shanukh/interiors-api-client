import { Firestore, Query, Timestamp } from "firebase-admin/firestore";
import { DatabaseAdapter } from "./DatabaseAdapter";
import { QueryOptions } from "../types/query.types";

export class FirestoreAdapter implements DatabaseAdapter {
  constructor(private db: Firestore) {}

  // Recursively converts Firestore Timestamp objects to JS Date objects
  private normalizeTimestamps(data: unknown): unknown {
    if (data instanceof Timestamp) {
      return data.toDate();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeTimestamps(item));
    }

    if (data && typeof data === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.normalizeTimestamps(value);
      }
      return result;
    }

    return data;
  }

  async create(collection: string, data: Record<string, unknown>) {
    const docRef = await this.db.collection(collection).add(data);
    return { id: docRef.id, data };
  }

  async findById(collection: string, id: string) {
    const snapshot = await this.db.collection(collection).doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    return this.normalizeTimestamps(snapshot.data() ?? null) as Record<
      string,
      unknown
    >;
  }

  async query(collection: string, options: QueryOptions) {
    let ref: Query = this.db.collection(collection);

    for (const clause of options.where) {
      ref = ref.where(clause.field, clause.operator, clause.value);
    }

    for (const order of options.orderBy) {
      ref = ref.orderBy(order.field, order.direction);
    }

    if (options.limitCount !== undefined) {
      ref = ref.limit(options.limitCount);
    }

    const snapshot = await ref.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: this.normalizeTimestamps(doc.data()) as Record<string, unknown>,
    }));
  }

  async update(collection: string, id: string, data: Record<string, unknown>) {
    await this.db.collection(collection).doc(id).update(data);
  }

  async delete(collection: string, id: string) {
    await this.db.collection(collection).doc(id).delete();
  }
}
