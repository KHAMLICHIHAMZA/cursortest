import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for automatically populating audit fields
 * 
 * This service provides helper methods to add audit fields (createdByUserId, updatedByUserId, etc.)
 * to data objects before database operations.
 * 
 * Audit fields are:
 * - Never editable from the frontend
 * - Automatically populated by the backend
 * - Excluded from public API responses by default
 */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add creation audit fields to data
   * 
   * @param data - Data object to add audit fields to
   * @param userId - User ID who is creating the entity
   */
  addCreateAuditFields<T extends Record<string, any>>(data: T, userId?: string): T {
    return {
      ...data,
      createdByUserId: userId || null,
      updatedByUserId: userId || null,
    };
  }

  /**
   * Add update audit fields to data
   * 
   * @param data - Data object to add audit fields to
   * @param userId - User ID who is updating the entity
   */
  addUpdateAuditFields<T extends Record<string, any>>(data: T, userId?: string): T {
    return {
      ...data,
      updatedByUserId: userId || null,
    };
  }

  /**
   * Add soft delete audit fields to data
   * 
   * @param data - Data object to add audit fields to
   * @param userId - User ID who is deleting the entity
   * @param reason - Optional reason for deletion
   */
  addDeleteAuditFields<T extends Record<string, any>>(
    data: T,
    userId?: string,
    reason?: string,
  ): T {
    return {
      ...data,
      deletedByUserId: userId || null,
      deletedReason: reason || null,
      deletedAt: new Date(),
    };
  }

  /**
   * Remove audit fields from data (for public API responses)
   * 
   * @param data - Data object to remove audit fields from
   */
  removeAuditFields<T extends Record<string, any>>(data: T): Omit<T, 'createdByUserId' | 'updatedByUserId' | 'deletedByUserId' | 'deletedReason'> {
    const { createdByUserId, updatedByUserId, deletedByUserId, deletedReason, ...rest } = data;
    return rest;
  }

  /**
   * Remove audit fields from array of data
   */
  removeAuditFieldsFromArray<T extends Record<string, any>>(
    data: T[],
  ): Array<Omit<T, 'createdByUserId' | 'updatedByUserId' | 'deletedByUserId' | 'deletedReason'>> {
    return data.map((item) => this.removeAuditFields(item));
  }
}



