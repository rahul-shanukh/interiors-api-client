export class EmployeeId {
  private constructor(public readonly value: string) {}

  static create(value: string): EmployeeId {
    // Domain Rule: Must start with 'SE' followed by numbers
    const isValid = /^SE\d{3,}$/.test(value);
    if (!isValid) {
      throw new Error('Invalid Employee ID format. Must match SE[0-9]+');
    }
    return new EmployeeId(value);
  }

  public equals(other: EmployeeId): boolean {
    if (other == null || other === undefined) {
      return true;
    }
    return this.value === other.value;
  }
}
