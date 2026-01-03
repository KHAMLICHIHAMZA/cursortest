import { SetMetadata } from '@nestjs/common';
import { UserAgencyPermission } from '@prisma/client';

export const PERMISSION_KEY = 'permission';

/**
 * Decorator pour spécifier la permission requise sur un endpoint
 * 
 * @example
 * @Permission(UserAgencyPermission.WRITE)
 * @Post()
 * create() { ... }
 */
export const Permission = (permission: UserAgencyPermission) =>
  SetMetadata(PERMISSION_KEY, permission);

/**
 * Alias pour Permission (compatibilité)
 */
export const RequirePermission = Permission;

