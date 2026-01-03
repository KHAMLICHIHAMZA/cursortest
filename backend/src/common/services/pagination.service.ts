import { Injectable } from '@nestjs/common';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Service pour gérer la pagination de manière cohérente
 */
@Injectable()
export class PaginationService {
  /**
   * Calcule les paramètres de pagination Prisma
   */
  getPaginationParams(options: PaginationOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20)); // Max 100 items

    return {
      skip: (page - 1) * limit,
      take: limit,
      page,
      limit,
    };
  }

  /**
   * Formate le résultat paginé
   */
  formatPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}



