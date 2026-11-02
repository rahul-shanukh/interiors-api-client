// src/modules/user/value-objects/user-id.vo.ts

export class UserId {
  private constructor(private readonly value: string) {}

  static create(value: string): UserId {
    if (!value || !value.trim()) {
      throw new Error("User ID cannot be empty");
    }

    // Preserve the Firebase UID exactly as Firebase supplied it.
    return new UserId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
