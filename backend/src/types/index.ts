import { Role, VehicleStatus, BookingStatus, MaintenanceStatus } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  companyId?: string;
  agencyIds?: string[];
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export { Role, VehicleStatus, BookingStatus, MaintenanceStatus };





