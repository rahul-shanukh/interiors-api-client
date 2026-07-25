import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql'; // 🚀 ADDED THIS IMPORT
import { ROLES_KEY, IS_PUBLIC_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // First priority: Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Second priority: Check what roles are required for this endpoint
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 🚀 THE FIX: Safely extract the request object for BOTH architectures
    let req;
    if (context.getType().toString() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      req = ctx.getContext().req;
    } else {
      req = context.switchToHttp().getRequest();
    }

    // If no specific roles are required, just check if user is authenticated
    if (!requiredRoles || requiredRoles.length === 0) {
      if (!req.session?.user) {
        throw new UnauthorizedException('Authentication required');
      }

      return true;
    }

    // If we reach here, specific roles are required.
    // First verify the user is authenticated
    if (!req.session?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Then verify they have one of the required roles
    if (!requiredRoles.includes(req.session.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
