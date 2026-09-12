// This value object represents a user's unique identifier
// We're keeping it simple with a string, but it's wrapped in a class
// to enforce type safety and prevent accidentally mixing user IDs with employee IDs
export class UserId {
  private constructor(private readonly value: string) {}

  static create(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    return new UserId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
