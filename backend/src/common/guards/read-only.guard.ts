import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException, SetMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

/**
 * Decorator to mark endpoints as read-only safe (always allowed even in read-only mode)
 */
export const READ_ONLY_SAFE_KEY = 'readOnlySafe';

export const ReadOnlySafe = () => SetMetadata(READ_ONLY_SAFE_KEY, true);

/**
 * Read-only mode guard
 * 
 * When READ_ONLY_MODE environment variable is enabled, blocks all write operations
 * (POST, PUT, PATCH, DELETE) except those marked with @ReadOnlySafe().
 * 
 * Useful for:
 * - Maintenance windows
 * - Incident response
 * - Audit periods
 * 
 * Configuration:
 * Set READ_ONLY_MODE=true in .env to enable
 */
@Injectable()
export class ReadOnlyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isReadOnlyMode = this.configService.get<string>('READ_ONLY_MODE') === 'true';

    // If read-only mode is not enabled, allow all requests
    if (!isReadOnlyMode) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Check if endpoint is marked as read-only safe
    const isReadOnlySafe = this.reflector.getAllAndOverride<boolean>(
      READ_ONLY_SAFE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isReadOnlySafe) {
      return true;
    }

    // Allow read operations (GET, OPTIONS, HEAD)
    const readMethods = ['GET', 'OPTIONS', 'HEAD'];
    if (readMethods.includes(method)) {
      return true;
    }

    // Block write operations
    throw new ServiceUnavailableException(
      'The application is currently in read-only mode. Write operations are temporarily disabled.',
    );
  }
}


