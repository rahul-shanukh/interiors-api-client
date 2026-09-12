/**
 * Base class for all Value Objects in the domain.
 * Uses Generic <T> so it can hold any type of properties.
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    // Object.freeze ensures the Value Object is truly immutable once created
    this.props = Object.freeze(props);
  }

  /**
   * Value Objects are compared by their properties, not by an ID or memory reference.
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    // A simple way to compare all nested properties of the generic type T
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
