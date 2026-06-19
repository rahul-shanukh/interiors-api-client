import { EmployeeId } from '../value-objects/employee-id.vo';
import { EmployeeRole } from '../value-objects/employee-role.vo';
import { EmployeeStatus } from '../value-objects/employee-status.enum';
import { Name } from '../value-objects/name.vo';
import { Address } from '../value-objects/address.vo';

export interface EmployeeProps {
  name: Name;
  email: string;
  role: EmployeeRole;
  addresses: Address[];
  status: EmployeeStatus;
  managerId: EmployeeId | null;
}

// 🚀 Look! No 'extends AggregateRoot' anymore. Just pure TS.
export class Employee {
  // We can manually track events if needed without external libraries
  private readonly _domainEvents: any[] = [];

  private constructor(
    private readonly _id: EmployeeId,
    private _props: EmployeeProps,
  ) {}

  // ---------------------------------------------------------
  // 1. FACTORIES
  // ---------------------------------------------------------

  static create(
    id: EmployeeId,
    props: Omit<EmployeeProps, 'status'>,
  ): Employee {
    const employee = new Employee(id, {
      ...props,
      status: EmployeeStatus.ACTIVE,
    });

    // Example of manual event tracking (no library needed)
    // employee.addDomainEvent(new EmployeeCreatedEvent(id.value));

    return employee;
  }

  static fromPersistence(id: EmployeeId, props: EmployeeProps): Employee {
    return new Employee(id, props);
  }

  // ---------------------------------------------------------
  // 2. BEHAVIORS
  // ---------------------------------------------------------

  public promote(newRole: EmployeeRole): void {
    if (this._props.status !== EmployeeStatus.ACTIVE) {
      throw new Error('Domain Rule: Cannot promote an inactive employee.');
    }
    this._props.role = newRole;
  }

  public assignManager(managerId: EmployeeId): void {
    if (this._id.equals(managerId)) {
      throw new Error('Domain Rule: An employee cannot be their own manager.');
    }
    this._props.managerId = managerId;
  }

  public terminate(): void {
    this._props.status = EmployeeStatus.TERMINATED;
  }

  // ---------------------------------------------------------
  // 3. GETTERS
  // ---------------------------------------------------------

  get id(): EmployeeId {
    return this._id;
  }
  get email(): string {
    return this._props.email;
  }
  get status(): EmployeeStatus {
    return this._props.status;
  }
  get managerId(): EmployeeId | null {
    return this._props.managerId;
  }

  getProps(): Readonly<EmployeeProps> {
    return Object.freeze({ ...this._props });
  }

  // ---------------------------------------------------------
  // 4. EVENT HANDLING (Custom, lightweight)
  // ---------------------------------------------------------

  private addDomainEvent(event: any): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents.length = 0;
  }

  get domainEvents(): ReadonlyArray<any> {
    return Object.freeze([...this._domainEvents]);
  }
}
