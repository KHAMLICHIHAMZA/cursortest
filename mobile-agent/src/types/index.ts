export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type FuelLevel = 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTERS' | 'FULL';

export type DamageZone = 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT' | 'ROOF' | 'INTERIOR' | 'WHEELS' | 'WINDOWS';

export type DamageType = 'SCRATCH' | 'DENT' | 'BROKEN' | 'PAINT' | 'GLASS' | 'OTHER';

export type DamageSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type DepositType = 'CASH' | 'CARD_HOLD' | 'TRANSFER' | 'CHEQUE' | 'OTHER';

export type DepositStatus = 'PENDING' | 'COLLECTED' | 'REFUNDED' | 'PARTIAL' | 'FORFEITED';
export type DepositStatusCheckIn = 'PENDING' | 'COLLECTED';

export type ExtractionStatus = 'OK' | 'TO_VERIFY';

export interface Damage {
  zone: DamageZone;
  type: DamageType;
  severity: DamageSeverity;
  description?: string;
  photos: string[];
}

export interface Booking {
  id: string;
  agencyId: string;
  companyId?: string;
  bookingNumber?: string;
  clientId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  price: number;
  status: BookingStatus;
  originalEndDate?: string; // Date de fin originale si prolongation
  extensionDays?: number; // Nombre de jours de prolongation
  odometerStart?: number;
  odometerEnd?: number;
  fuelLevelStart?: FuelLevel;
  fuelLevelEnd?: FuelLevel;
  photosBefore?: string[];
  photosAfter?: string[];
  notesStart?: string;
  notesEnd?: string;
  existingDamages?: Damage[];
  newDamages?: Damage[];
  driverLicensePhoto?: string;
  driverLicenseExpiry?: string;
  identityDocument?: string;
  extractionStatus?: ExtractionStatus;
  depositRequired?: boolean;
  depositAmount?: number;
  depositDecisionSource?: 'COMPANY' | 'AGENCY';
  depositStatusCheckIn?: DepositStatusCheckIn;
  depositStatusFinal?: 'REFUNDED' | 'PARTIAL' | 'FORFEITED' | 'DISPUTED';
  signature?: string;
  signedAt?: string;
  returnSignature?: string;
  returnedAt?: string;
  extraFees?: number;
  lateFee?: number;
  damageFee?: number;
  cashCollected?: boolean;
  cashAmount?: number;
  cashReceipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  agencyId: string;
  clientId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
}

export interface CheckInInput {
  bookingId: string;
  odometerStart: number;
  fuelLevelStart: FuelLevel;
  photosBefore: string[];
  notesStart?: string;
  existingDamages?: Damage[];
  driverLicensePhoto: string;
  driverLicenseExpiry: string;
  identityDocument?: string;
  extractionStatus?: ExtractionStatus;
  depositStatusCheckIn?: DepositStatusCheckIn; // Statut au check-in uniquement (PENDING ou COLLECTED)
  signature: string;
  signedAt?: string;
}

export interface CheckOutInput {
  bookingId: string;
  odometerEnd: number;
  fuelLevelEnd: FuelLevel;
  photosAfter: string[];
  notesEnd?: string;
  newDamages?: Damage[];
  extraFees?: number;
  lateFee?: number;
  damageFee?: number;
  cashCollected?: boolean;
  cashAmount?: number;
  cashReceipt?: string;
  returnSignature: string;
  returnedAt?: string;
}

/**
 * Agent Task - Tâche dérivée d'une location
 * 
 * IMPORTANT (Spécifications MALOC) :
 * - Les tâches sont DÉRIVÉES des bookings, jamais persistées en base
 * - Calculées à la volée depuis les statuts de booking
 * - CONFIRMED → Tâche "Livraison / Check-in"
 * - ACTIVE → Tâche "Récupération / Check-out"
 * - COMPLETED / CANCELLED → Aucune tâche
 * 
 * Cette interface est utilisée uniquement pour le calcul et l'affichage,
 * jamais pour la persistance.
 */
export type TaskType = 'CHECK_IN' | 'CHECK_OUT';

export interface AgentTask {
  id: string; // Booking ID (utilisé comme identifiant unique)
  type: TaskType;
  bookingId: string;
  vehicle?: {
    id: string;
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  client?: {
    id: string;
    name?: string;
    phone?: string;
  };
  date: string; // Date de la tâche (startDate pour CHECK_IN, endDate pour CHECK_OUT)
  location?: string; // Lieu de livraison/récupération
  booking: Booking; // Référence complète au booking
}

