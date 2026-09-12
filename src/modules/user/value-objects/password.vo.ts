import * as bcrypt from 'bcrypt';

// Password value object handles hashing and validation
// This encapsulates all password-related logic in one place
export class Password {
  private constructor(private readonly hashedValue: string) {}

  // Create a new password from plain text (used during activation)
  static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword || plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash the password with bcrypt using 10 salt rounds
    // This is a one-way operation - you can never get the original password back
    const hashed = await bcrypt.hash(plainPassword, 10);
    return new Password(hashed);
  }

  // Create from an already-hashed password (used when loading from database)
  static fromHash(hashedPassword: string): Password {
    return new Password(hashedPassword);
  }

  // Verify if a plain text password matches this hashed password
  async verify(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hashedValue);
  }

  getHash(): string {
    return this.hashedValue;
  }
}
