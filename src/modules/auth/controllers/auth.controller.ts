// src/modules/auth/controllers/auth.controller.ts

import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { RegisterUserDto } from "../application/dto/register-user.dto";
import { AuthService } from "../application/services/auth.service";
import { Public } from "src/common/decorators/roles.decorator";
import type { User } from "../../user/domain/entities/user.entity";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Create a profile for a Firebase user" })
  @ApiHeader({
    name: "Authorization",
    required: true,
    description: "Bearer <Firebase ID token>",
  })
  @ApiCreatedResponse({ description: "User profile created" })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async register(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: RegisterUserDto,
  ) {
    const idToken = this.extractBearerToken(authorization);
    const user = await this.authService.registerUser(idToken, body);

    return this.toProfileResponse(user);
  }

  @Public()
  @Get("me")
  @ApiOperation({ summary: "Get the current user's profile" })
  @ApiHeader({
    name: "Authorization",
    required: true,
    description: "Bearer <Firebase ID token>",
  })
  @ApiOkResponse({ description: "Current user profile returned" })
  async getCurrentUser(
    @Headers("authorization") authorization: string | undefined,
  ) {
    const idToken = this.extractBearerToken(authorization);

    const user = await this.authService.getCurrentUser(idToken);

    return this.toProfileResponse(user);
  }

  private extractBearerToken(authorization: string | undefined): string {
    const match = /^Bearer\s+(\S+)$/i.exec(authorization?.trim() ?? "");
    const token = match?.[1];

    if (!token) {
      throw new UnauthorizedException(
        "Authorization header must contain a Firebase bearer token",
      );
    }

    return token;
  }

  private toProfileResponse(user: User) {
    return {
      userId: user.id.getValue(),
      username: user.username.getValue(),
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      phone: user.phone ?? null,
      phoneVerified: user.phoneVerified,
      whatsappUpdates: user.whatsappUpdates,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
