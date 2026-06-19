export class Name {
  private constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly middleName?: string,
  ) {}

  static create(
    firstName: string,
    lastName: string,
    middleName?: string,
  ): Name {
    if (!firstName || !lastName) {
      throw new Error('First and Last name are required');
    }
    if(firstName === lastName) {
      throw new Error ('First Name and Last Name are Same ')
    }
    return new Name(firstName, lastName, middleName);
  }
}
