import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Decorator pour extraire les paramètres de pagination de la requête
 */
export const Paginate = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationParams => {
    const request = ctx.switchToHttp().getRequest();
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 20));

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
    };
  },
);



