import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AuditAction } from '@prisma/client';

/**
 * Interceptor pour logger automatiquement les actions
 * Utilisé sur les controllers critiques
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;

    // Déterminer l'action selon la méthode HTTP
    let action: AuditAction | null = null;
    if (method === 'POST') action = AuditAction.CREATE;
    else if (method === 'PATCH' || method === 'PUT') action = AuditAction.UPDATE;
    else if (method === 'DELETE') action = AuditAction.DELETE;

    return next.handle().pipe(
      tap(async (data) => {
        if (action && user) {
          // Extraire l'entity type de l'URL
          const entityType = url.split('/')[2]?.toUpperCase().slice(0, -1); // /api/bookings -> Booking

          if (entityType && data?.id) {
            await this.auditService.log({
              userId: user.sub || user.userId,
              companyId: user.companyId,
              agencyId: user.agencyIds?.[0],
              action,
              entityType,
              entityId: data.id,
              description: `${method} ${url}`,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            });
          }
        }
      }),
    );
  }
}



