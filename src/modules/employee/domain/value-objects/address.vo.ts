export enum AddressType {
  PERMANENT = 'PERMANENT',
  CURRENT = 'CURRENT',
  OFFICE = 'OFFICE',
}

export class Address {
  private constructor(
    public readonly type: AddressType,
    public readonly line1: string,
    public readonly city: string,
    public readonly state: string,
    public readonly postalCode: string,
    public readonly country: string,
    public readonly line2?: string,
  ) {}

  static create(props: {
    type: AddressType;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    line2?: string;
  }): Address {
    return new Address(
      props.type,
      props.street,
      props.city,
      props.state,
      props.postalCode,
      props.country,
      props.line2,
    );
  }
}
