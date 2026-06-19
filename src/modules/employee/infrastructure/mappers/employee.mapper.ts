import { Employee as EmployeeEntity } from '../../domain/entities/employee.entity';
import { EmployeeDocument } from '../persistence/mongo/employee.schema';
import { EmployeeId } from '../../domain/value-objects/employee-id.vo';
import { Name } from '../../domain/value-objects/name.vo';
import {
  EmployeeRole,
  EmployeeRoleType,
} from '../../domain/value-objects/employee-role.vo';
import { Address, AddressType } from '../../domain/value-objects/address.vo';
import { EmployeeStatus } from '../../domain/value-objects/employee-status.enum';

export class EmployeeMapper {
  /**
   * Maps MongoDB Document -> Domain Entity
   */
  public static toDomain(raw: EmployeeDocument): EmployeeEntity {
    // 1. Identity & Name
    const employeeId = EmployeeId.create(raw.identity.emp_id);

    const name = Name.create(
      raw.identity.first_name,
      raw.identity.last_name,
      raw.identity.middle_name,
    );

    // 2. Role
    const role = EmployeeRole.create(raw.pmo.role_name);

    // 3. Addresses
    const addresses: Address[] = [];

    if (raw.contact?.current_address) {
      addresses.push(
        Address.create({
          type: AddressType.CURRENT,
          street: raw.contact.current_address.street,
          city: raw.contact.current_address.city,
          state: raw.contact.current_address.state,
          postalCode: raw.contact.current_address.zip_code,
          country: raw.contact.current_address.country,
        }),
      );
    }

    if (raw.contact?.permanent_address) {
      addresses.push(
        Address.create({
          type: AddressType.PERMANENT,
          street: raw.contact.permanent_address.street,
          city: raw.contact.permanent_address.city,
          state: raw.contact.permanent_address.state,
          postalCode: raw.contact.permanent_address.zip_code,
          country: raw.contact.permanent_address.country,
        }),
      );
    }

    if (raw.contact?.office_address) {
      addresses.push(
        Address.create({
          type: AddressType.OFFICE,
          // FIX: Changed from permanent_address to office_address
          street: raw.contact.office_address.street,
          city: raw.contact.office_address.city,
          state: raw.contact.office_address.state,
          postalCode: raw.contact.office_address.zip_code,
          country: raw.contact.office_address.country,
        }),
      );
    }

    // 4. Manager Reference
    const managerId = raw.pmo?.manager_id
      ? EmployeeId.create(raw.pmo.manager_id)
      : null;

    // 5. Reconstruct Entity
    return EmployeeEntity.fromPersistence(employeeId, {
      name,
      email: raw.identity.email,
      role,
      addresses,
      status: raw.lifecycle.status as EmployeeStatus,
      managerId,
    });
  }

  /**
   * Maps Domain Entity -> Persistence Object (Mongoose)
   */
  public static toPersistence(entity: EmployeeEntity): any {
    const props = entity.getProps();

    // Extract specific addresses
    const current = props.addresses.find((a) => a.type === AddressType.CURRENT);
    const permanent = props.addresses.find(
      (a) => a.type === AddressType.PERMANENT,
    );
    const office = props.addresses.find((a) => a.type === AddressType.OFFICE);

    // Determine role_group based on Role Type
    const roleGroup =
      props.role.getValue() === EmployeeRoleType.ADMIN ||
      props.role.getValue() === EmployeeRoleType.MANAGER
        ? 'admin'
        : 'employee';

    return {
      identity: {
        emp_id: entity.id.value,
        first_name: props.name.firstName,
        last_name: props.name.lastName,
        email: props.email,
      },
      lifecycle: {
        status: props.status,
        role_group: roleGroup,
        hire_date: new Date().toISOString().split('T')[0],
      },
      contact: {
        current_address: current
          ? {
              street: current.line1,
              city: current.city,
              state: current.state,
              zip_code: current.postalCode,
              country: current.country,
            }
          : undefined,
        permanent_address: permanent
          ? {
              street: permanent.line1,
              city: permanent.city,
              state: permanent.state,
              zip_code: permanent.postalCode,
              country: permanent.country,
            }
          : undefined,
        // FIX: Added office_address mapping to persistence
        office_address: office
          ? {
              street: office.line1,
              city: office.city,
              state: office.state,
              zip_code: office.postalCode,
              country: office.country,
            }
          : undefined,
      },
      pmo: {
        role_name: props.role.getValue(),
        manager_id: props.managerId ? props.managerId.value : null,
        department_name: 'UNASSIGNED',
      },
    };
  }
}
