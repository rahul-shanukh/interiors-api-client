//src/modules/user/application/dto/activate-user.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength } from "class-validator";

export class ActivateUserDto {
  @ApiProperty({
    example: "user123",
    description: "user id",
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string; // The employee ID from the employee collection

  @ApiProperty({
    example: "StrongPass123",
    description: "Password to set for the account.",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string; // The password they want to set for their account
}
