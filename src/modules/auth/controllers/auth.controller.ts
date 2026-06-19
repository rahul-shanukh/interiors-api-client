import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../application/services/auth.service';
import { LoginDto } from '../application/dto/login.dto';
import { Public } from 'src/common/decorators/roles.decorator';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthResponseDto,
  CurrentUserResponseDto,
} from '../application/dto/auth-response.dto';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';

// The AuthController handles authentication endpoints
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
  // This is for users who have already activated their account and want to log in
  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Log in with employee credentials',
    description: 'Creates a server-side session and sets the session cookie.',
  })
  @ApiCreatedResponse({
    description: 'Login succeeded and session was created.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credentials are invalid or the user cannot be authenticated.',
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.authService.validateUser(
      dto.username,
      dto.password,
    );

    req.session.user = {
      userId: user.userId,
      employeeId: user.employeeId,
      role: user.role,
      name: user.name,
    };

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully');
          resolve(true);
        }
      });
    });

    return {
      message: 'Login successful',
      user: {
        userId: user.userId,
        employeeId: user.employeeId,
        role: user.role,
        name: user.name, // Include the employee's name in the response
      },
    };
  }

  @Public()
  @Get('me')
  @ApiCookieAuth('connect.sid')
  @ApiOperation({
    summary: 'Get current session user',
    description: 'Returns the user stored in the current session cookie.',
  })
  @ApiOkResponse({
    description: 'Current user session payload.',
    type: CurrentUserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Session cookie is missing or expired.',
  })
  getCurrentUser(@Req() req: Request) {
    if (!req.session?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return {
      user: req.session.user,
    };
  }

  // POST /auth/logout
  // Destroy the session to log the user out
  @Public()
  @Post('logout')
  @ApiCookieAuth('connect.sid')
  @ApiOperation({
    summary: 'Log out current user',
    description: 'Destroys the active session and clears the session cookie.',
  })
  @ApiCreatedResponse({
    description: 'Logout succeeded.',
    type: MessageResponseDto,
  })
  async logout(@Req() req: Request) {
    if (!req.session) {
      return { message: 'Logout successful' };
    }

    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject({ message: 'Logout failed' });
        } else {
          req.res?.clearCookie('connect.sid');
          resolve({ message: 'Logout successful' });
        }
      });
    });
  }
}
