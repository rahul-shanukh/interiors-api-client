// src/modules/user/application/dto/register-user.dto.ts

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from "class-validator";

export class RegisterUserDto {
  @ApiProperty({ example: "vinay_designs" })
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  username!: string;

  @ApiPropertyOptional({ example: "vinay@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+919876543210" })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  whatsappUpdates!: boolean;
}
