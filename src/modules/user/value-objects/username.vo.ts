// src/modules/user/value-objects/username.vo.ts

export class Username {
  private constructor(private readonly value: string) {}

  static create(value: string): Username {
    const normalized = value?.trim();

    if (!normalized || normalized.length < 3 || normalized.length > 30) {
      throw new Error("Username must be between 3 and 30 characters");
    }

    return new Username(normalized);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
