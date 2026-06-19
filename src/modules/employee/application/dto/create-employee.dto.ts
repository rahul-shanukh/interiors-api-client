//backend\src\modules\employee\application\dto\create-employee.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeRoleType } from '../../domain/value-objects/employee-role.vo';
import { AddressType } from '../../domain/value-objects/address.vo';

class AddressDto {
  @ApiProperty({
    enum: AddressType,
    example: AddressType.CURRENT,
    description: 'Type of employee address.',
  })
  @IsEnum(AddressType)
  type: AddressType;

  @ApiProperty({
    example: '12 MG Road',
    description: 'Street address line.',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    example: 'Bengaluru',
    description: 'City for the address.',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'Karnataka',
    description: 'State for the address.',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: '560001',
    description: 'Postal or ZIP code.',
  })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({
    example: 'India',
    description: 'Country for the address.',
  })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'SE282',
    description: 'Unique employee identifier.',
  })
  @IsString()
  @IsNotEmpty()
  empId: string;

  @ApiProperty({
    example: 'Aarav',
    description: 'Employee first name.',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Sharma',
    description: 'Employee last name.',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'aarav.sharma@example.com',
    description: 'Employee email address.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: EmployeeRoleType,
    example: EmployeeRoleType.EMPLOYEE,
    description: 'Employee role in the organization.',
  })
  @IsEnum(EmployeeRoleType)
  role: EmployeeRoleType;

  @ApiProperty({
    type: [AddressDto],
    description: 'Employee addresses.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses: AddressDto[];
}
