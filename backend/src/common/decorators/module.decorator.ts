import { SetMetadata } from '@nestjs/common';
import { ModuleCode } from '@prisma/client';

export const MODULE_KEY = 'module';

/**
 * Decorator pour spécifier le module requis sur un endpoint
 * 
 * @example
 * @Module(ModuleCode.BOOKINGS)
 * @Get()
 * findAll() { ... }
 */
export const Module = (moduleCode: ModuleCode) => SetMetadata(MODULE_KEY, moduleCode);


