import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

/**
 * Permission decorator metadata key
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Permission decorator
 * Use this to specify required permissions on controllers/methods
 * 
 * @example
 * @Permissions('vehicles:create')
 * @Post()
 * createVehicle() { ... }
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Permission-based access control guard
 * 
 * Enforces role-based permissions on endpoints.
 * 
 * Role permissions:
 * - AGENCY_MANAGER: Full CRUD on all modules, can delete, can access analytics
 * - AGENT: Read access on all, can create/update Clients/Bookings/Fines, cannot delete
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const userRole = user.role as Role;

    // Si l'utilisateur a des permissions UserAgency (READ/WRITE/FULL), les vérifier d'abord
    // Les permissions UserAgency surchargent les permissions basiques du rôle
    const agencyId = request.params?.agencyId || request.body?.agencyId || request.query?.agencyId;
    if (agencyId && user.userAgencies) {
      const userAgency = user.userAgencies.find((ua: any) => ua.agencyId === agencyId);
      if (userAgency) {
        // Vérifier les permissions UserAgency
        const hasUserAgencyPermission = this.checkUserAgencyPermissions(
          userAgency.permission,
          requiredPermissions,
        );
        if (hasUserAgencyPermission !== null) {
          // Si la vérification UserAgency a donné un résultat (true ou false), l'utiliser
          if (!hasUserAgencyPermission) {
            throw new ForbiddenException(
              `Permissions insuffisantes. Requis : ${requiredPermissions.join(', ')}`,
            );
          }
          return true;
        }
        // Si hasUserAgencyPermission est null, continuer avec la vérification basique du rôle
      }
    }

    // Check if user has required permissions based on role
    const hasPermission = this.checkPermissions(userRole, requiredPermissions);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permissions insuffisantes. Requis : ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Vérifie les permissions UserAgency (READ/WRITE/FULL)
   * Retourne true si autorisé, false si refusé, null si la vérification doit continuer avec le rôle
   */
  private checkUserAgencyPermissions(
    userAgencyPermission: string,
    requiredPermissions: string[],
  ): boolean | null {
    // FULL : Toutes les permissions
    if (userAgencyPermission === 'FULL') {
      return true;
    }

    // READ : Seulement les permissions de lecture
    if (userAgencyPermission === 'READ') {
      if (requiredPermissions.some((p) => p.endsWith(':read'))) {
        return true;
      }
      return false;
    }

    // WRITE : Lecture + Écriture (pas de suppression)
    if (userAgencyPermission === 'WRITE') {
      // Permissions de lecture autorisées
      if (requiredPermissions.some((p) => p.endsWith(':read'))) {
        return true;
      }
      // Permissions de création/mise à jour autorisées
      if (
        requiredPermissions.some(
          (p) => p.endsWith(':create') || p.endsWith(':update'),
        )
      ) {
        return true;
      }
      // Permissions de suppression refusées
      if (requiredPermissions.some((p) => p.endsWith(':delete'))) {
        return false;
      }
      // Pour les autres permissions, continuer avec la vérification basique du rôle
      return null;
    }

    // Permission inconnue, continuer avec la vérification basique
    return null;
  }

  /**
   * Check if user role has required permissions
   */
  private checkPermissions(userRole: Role, requiredPermissions: string[]): boolean {
    // AGENCY_MANAGER has all permissions
    if (userRole === 'AGENCY_MANAGER') {
      return true;
    }

    // AGENT permissions (opérationnel uniquement)
    // Spec: AGENT peut gérer locations et clients. Pas d'accès aux amendes, charges, maintenance, KPI, analytics.
    if (userRole === 'AGENT') {
      // Modules INTERDITS pour AGENT (spec: Agents n'ont pas accès)
      const forbiddenModules = ['fines', 'maintenance', 'charges', 'analytics', 'journal', 'invoices', 'contracts', 'gps'];
      if (requiredPermissions.some((p) => forbiddenModules.some(m => p.startsWith(`${m}:`)))) {
        return false;
      }

      // Agents can read: clients, bookings, vehicles (lecture seule flotte), planning
      const allowedRead = ['clients:read', 'bookings:read', 'vehicles:read', 'planning:read'];
      if (requiredPermissions.some((p) => p.endsWith(':read') && allowedRead.includes(p))) {
        return true;
      }

      // Agents can create/update: clients, bookings
      const allowedCreateUpdate = [
        'clients:create',
        'clients:update',
        'bookings:create',
        'bookings:update',
      ];
      if (requiredPermissions.some((p) => allowedCreateUpdate.includes(p))) {
        return true;
      }

      // Agents cannot delete anything
      if (requiredPermissions.some((p) => p.endsWith(':delete'))) {
        return false;
      }

      // Agents cannot create/update vehicles
      if (requiredPermissions.some((p) => p.startsWith('vehicles:') && !p.endsWith(':read'))) {
        return false;
      }

      // Default deny for AGENT
      return false;
    }

    // SUPER_ADMIN and COMPANY_ADMIN have full access
    if (userRole === 'SUPER_ADMIN' || userRole === 'COMPANY_ADMIN') {
      return true;
    }

    return false;
  }
}


