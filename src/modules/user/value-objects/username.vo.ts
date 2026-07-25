// Username value object - in your system, username is the employee ID
// We keep this as a value object to maintain type safety and validation
export class Username {
  private constructor(private readonly value: string) {}

  static create(value: string): Username {
    if (!value || value.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    // Since username is the employee ID, we expect it to follow the employee ID format
    // This helps catch errors early if someone tries to use an invalid format
    if (value.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    return new Username(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
