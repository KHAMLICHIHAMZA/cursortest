import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PrismaSoftDeleteService } from "../../common/prisma/prisma-soft-delete.service";
import { AuditService } from "../../common/services/audit.service";
import { BusinessEventLogService } from "../business-event-log/business-event-log.service";
import { CreateAgencyDto } from "./dto/create-agency.dto";
import { UpdateAgencyDto } from "./dto/update-agency.dto";
import { AgencyStatus, BusinessEventType, Role } from "@prisma/client";

@Injectable()
export class AgencyService {
  private readonly logger = new Logger(AgencyService.name);
  private readonly structuredAgencyPrefix = "__AGENCY_STRUCTURED_V1__:";

  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  private parseStructuredAgencyAddress(address?: string | null): {
    displayAddress?: string;
    addressDetails?: Record<string, any>;
    openingHours?: Record<string, any>;
  } {
    if (!address) return {};
    if (!address.startsWith(this.structuredAgencyPrefix)) {
      return { displayAddress: address };
    }

    try {
      const raw = address.slice(this.structuredAgencyPrefix.length);
      const parsed = JSON.parse(raw) as {
        displayAddress?: string;
        addressDetails?: Record<string, any>;
        openingHours?: Record<string, any>;
      };
      return {
        displayAddress: parsed.displayAddress,
        addressDetails: parsed.addressDetails,
        openingHours: parsed.openingHours,
      };
    } catch {
      return { displayAddress: address };
    }
  }

  private buildDisplayAddress(
    fallbackAddress?: string,
    addressDetails?: Record<string, any>,
  ): string | undefined {
    if (!addressDetails) return fallbackAddress || undefined;
    const line = [addressDetails.line1, addressDetails.line2]
      .filter(Boolean)
      .join(", ");
    const cityLine = [addressDetails.postalCode, addressDetails.city]
      .filter(Boolean)
      .join(" ");
    const country = addressDetails.country || "";
    const joined = [line, cityLine, country].filter(Boolean).join(" - ");
    return joined || fallbackAddress || undefined;
  }

  private serializeAgencyAddress(payload: {
    displayAddress?: string;
    addressDetails?: Record<string, any>;
    openingHours?: Record<string, any>;
  }): string | undefined {
    const hasStructured = !!payload.addressDetails || !!payload.openingHours;
    if (!hasStructured) return payload.displayAddress || undefined;
    return `${this.structuredAgencyPrefix}${JSON.stringify({
      displayAddress: payload.displayAddress,
      addressDetails: payload.addressDetails,
      openingHours: payload.openingHours,
    })}`;
  }

  private normalizeAgencyOutput<T extends Record<string, any>>(
    agency: T,
  ): T & {
    addressDetails?: Record<string, any>;
    openingHours?: Record<string, any>;
  } {
    const parsed = this.parseStructuredAgencyAddress(agency.address);
    return {
      ...agency,
      address: parsed.displayAddress || agency.address,
      addressDetails: parsed.addressDetails,
      openingHours: parsed.openingHours,
    };
  }

  async findAll(user: any) {
    let agencies;
    if (user.role === "SUPER_ADMIN") {
      agencies = await this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter(),
        include: {
          company: true,
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              userAgencies: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "COMPANY_ADMIN" && user.companyId) {
      agencies = await this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({
          companyId: user.companyId,
        }),
        include: {
          company: true,
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              userAgencies: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      agencies = await this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({
          id: { in: user.agencyIds },
        }),
        include: {
          company: true,
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              userAgencies: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return [];
    }

    // Remove audit fields from public responses
    return this.auditService
      .removeAuditFieldsFromArray(agencies)
      .map((item: any) => this.normalizeAgencyOutput(item));
  }

  async findLookup(user: any) {
    if (user.role === "SUPER_ADMIN") {
      return this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter(
          user.companyId ? { companyId: user.companyId } : {},
        ),
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId) {
      return this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({
          companyId: user.companyId,
        }),
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    }

    if (user.agencyIds && user.agencyIds.length > 0) {
      return this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({
          id: { in: user.agencyIds },
        }),
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    }

    return [];
  }

  async findAllLight(user: any, page = 1, pageSize = 25, q?: string) {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.min(Math.max(1, Math.floor(pageSize)), 100)
      : 25;
    const skip = (safePage - 1) * safePageSize;
    const search = q?.trim();

    const baseInclude = {
      company: true,
      _count: {
        select: {
          vehicles: true,
          bookings: true,
          userAgencies: true,
        },
      },
    } as const;

    if (user.role === "SUPER_ADMIN") {
      const where = this.softDeleteService.addSoftDeleteFilter({
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                {
                  company: { name: { contains: search, mode: "insensitive" } },
                },
              ],
            }
          : {}),
      });
      const [itemsRaw, total] = await Promise.all([
        this.prisma.agency.findMany({
          where,
          include: baseInclude,
          orderBy: { createdAt: "desc" },
          skip,
          take: safePageSize,
        }),
        this.prisma.agency.count({ where }),
      ]);
      const items = this.auditService
        .removeAuditFieldsFromArray(itemsRaw)
        .map((item: any) => this.normalizeAgencyOutput(item));
      return {
        items,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      };
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId) {
      const where = this.softDeleteService.addSoftDeleteFilter({
        companyId: user.companyId,
        ...(search
          ? {
              OR: [{ name: { contains: search, mode: "insensitive" } }],
            }
          : {}),
      });
      const [itemsRaw, total] = await Promise.all([
        this.prisma.agency.findMany({
          where,
          include: baseInclude,
          orderBy: { createdAt: "desc" },
          skip,
          take: safePageSize,
        }),
        this.prisma.agency.count({ where }),
      ]);
      const items = this.auditService
        .removeAuditFieldsFromArray(itemsRaw)
        .map((item: any) => this.normalizeAgencyOutput(item));
      return {
        items,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      };
    }

    if (user.agencyIds && user.agencyIds.length > 0) {
      const where = this.softDeleteService.addSoftDeleteFilter({
        id: { in: user.agencyIds },
        ...(search
          ? {
              OR: [{ name: { contains: search, mode: "insensitive" } }],
            }
          : {}),
      });
      const [itemsRaw, total] = await Promise.all([
        this.prisma.agency.findMany({
          where,
          include: baseInclude,
          orderBy: { createdAt: "desc" },
          skip,
          take: safePageSize,
        }),
        this.prisma.agency.count({ where }),
      ]);
      const items = this.auditService
        .removeAuditFieldsFromArray(itemsRaw)
        .map((item: any) => this.normalizeAgencyOutput(item));
      return {
        items,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      };
    }

    return {
      items: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
      totalPages: 1,
    };
  }

  async findOne(id: string, user: any) {
    const agency = await this.prisma.agency.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      include: {
        company: true,
        vehicles: true,
        userAgencies: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException("Agence introuvable");
    }

    // Check permissions
    if (user.role === "COMPANY_ADMIN" && agency.companyId !== user.companyId) {
      throw new ForbiddenException(
        "Accès refusé : cette agence n'appartient pas à votre société",
      );
    }

    if (
      (user.role === "AGENCY_MANAGER" || user.role === "AGENT") &&
      !user.agencyIds?.includes(id)
    ) {
      throw new ForbiddenException(
        "Accès refusé : vous n'êtes pas rattaché(e) à cette agence",
      );
    }

    // Remove audit fields from public responses
    return this.normalizeAgencyOutput(
      this.auditService.removeAuditFields(agency),
    );
  }

  async create(createAgencyDto: CreateAgencyDto, user: any) {
    const { name, phone, address, companyId, addressDetails, openingHours } =
      createAgencyDto;

    if (!name) {
      throw new BadRequestException("Le nom de l'agence est requis");
    }

    let targetCompanyId = companyId || user.companyId;

    if (user.role === "SUPER_ADMIN") {
      if (!companyId) {
        throw new BadRequestException("L'identifiant de la société est requis");
      }
      targetCompanyId = companyId;
    } else if (user.role === "COMPANY_ADMIN") {
      if (companyId && companyId !== user.companyId) {
        throw new ForbiddenException(
          "Impossible de créer une agence pour une autre société",
        );
      }
      targetCompanyId = user.companyId!;
    } else {
      throw new ForbiddenException(
        "Permissions insuffisantes : seuls SUPER_ADMIN et COMPANY_ADMIN peuvent créer des agences",
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: targetCompanyId },
    });

    if (!company || !company.isActive) {
      throw new BadRequestException(
        "Société introuvable ou inactive. Vérifiez que la société existe et est active.",
      );
    }

    if (company.maxAgencies !== null && company.maxAgencies !== undefined) {
      const activeAgenciesCount = await this.prisma.agency.count({
        where: this.softDeleteService.addSoftDeleteFilter({
          companyId: targetCompanyId,
          NOT: { status: "DELETED" },
        }),
      });

      if (activeAgenciesCount >= company.maxAgencies) {
        const eventPayload = {
          companyId: targetCompanyId,
          requestedAgencyName: name,
          currentCount: activeAgenciesCount,
          maxAgencies: company.maxAgencies,
        };

        await this.businessEventLogService.logEvent(
          null,
          "Agency",
          targetCompanyId,
          BusinessEventType.AGENCY_CREATE_BLOCKED_MAX_LIMIT,
          null,
          eventPayload,
          user?.id || user?.userId || user?.sub,
          targetCompanyId,
        );

        throw new ConflictException(
          `Limite d’agences atteinte (${activeAgenciesCount}/${company.maxAgencies})`,
        );
      }
    }

    const displayAddress = this.buildDisplayAddress(
      address,
      addressDetails as Record<string, any> | undefined,
    );
    const serializedAddress = this.serializeAgencyAddress({
      displayAddress,
      addressDetails: addressDetails as Record<string, any> | undefined,
      openingHours: openingHours as Record<string, any> | undefined,
    });

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        name,
        phone,
        address: serializedAddress,
        companyId: targetCompanyId,
        preparationTimeMinutes: createAgencyDto.preparationTimeMinutes || 60, // Default 60 minutes
      },
      user?.id || user?.userId || user?.sub,
    );

    const agency = await this.prisma.agency.create({
      data: dataWithAudit,
      include: {
        company: true,
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        agency.id,
        "Agency",
        agency.id,
        BusinessEventType.AGENCY_CREATED,
        null,
        agency,
        user?.id || user?.userId || user?.sub,
        agency.companyId, // companyId
      )
      .catch((err) =>
        this.logger.error("Error logging agency creation event:", err),
      );

    // Remove audit fields from public responses
    return this.normalizeAgencyOutput(
      this.auditService.removeAuditFields(agency),
    );
  }

  async update(id: string, updateAgencyDto: UpdateAgencyDto, user: any) {
    const agency = await this.prisma.agency.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!agency) {
      throw new NotFoundException("Agence introuvable");
    }

    // Check permissions
    if (user.role === "COMPANY_ADMIN" && agency.companyId !== user.companyId) {
      throw new ForbiddenException(
        "Impossible de mettre à jour une agence d'une autre société",
      );
    }

    if (
      (user.role === "AGENCY_MANAGER" || user.role === "AGENT") &&
      !user.agencyIds?.includes(id)
    ) {
      throw new ForbiddenException(
        "Accès refusé : vous n'êtes pas rattaché(e) à cette agence",
      );
    }

    // Store previous state for event log
    const previousState = { ...agency };

    const currentStructured = this.parseStructuredAgencyAddress(agency.address);
    const nextAddressDetails =
      updateAgencyDto.addressDetails !== undefined
        ? (updateAgencyDto.addressDetails as Record<string, any> | undefined)
        : currentStructured.addressDetails;
    const nextOpeningHours =
      updateAgencyDto.openingHours !== undefined
        ? (updateAgencyDto.openingHours as Record<string, any> | undefined)
        : currentStructured.openingHours;
    const nextRawAddress =
      updateAgencyDto.address !== undefined
        ? updateAgencyDto.address
        : currentStructured.displayAddress;

    const updateData: any = {};
    if (updateAgencyDto.name !== undefined)
      updateData.name = updateAgencyDto.name;
    if (updateAgencyDto.phone !== undefined)
      updateData.phone = updateAgencyDto.phone;
    if (
      updateAgencyDto.address !== undefined ||
      updateAgencyDto.addressDetails !== undefined ||
      updateAgencyDto.openingHours !== undefined
    ) {
      const nextDisplayAddress = this.buildDisplayAddress(
        nextRawAddress,
        nextAddressDetails,
      );
      updateData.address = this.serializeAgencyAddress({
        displayAddress: nextDisplayAddress,
        addressDetails: nextAddressDetails,
        openingHours: nextOpeningHours,
      });
    }
    if (updateAgencyDto.preparationTimeMinutes !== undefined) {
      if (updateAgencyDto.preparationTimeMinutes < 1) {
        throw new BadRequestException(
          "Le temps de préparation doit être supérieur à 0",
        );
      }
      updateData.preparationTimeMinutes =
        updateAgencyDto.preparationTimeMinutes;
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(
      updateData,
      user?.id || user?.userId || user?.sub,
    );

    const updatedAgency = await this.prisma.agency.update({
      where: { id },
      data: dataWithAudit,
      include: {
        company: true,
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        updatedAgency.id,
        "Agency",
        updatedAgency.id,
        BusinessEventType.AGENCY_UPDATED,
        previousState,
        updatedAgency,
        user?.id || user?.userId || user?.sub,
        updatedAgency.companyId, // companyId
      )
      .catch((err) =>
        this.logger.error("Error logging agency update event:", err),
      );

    // Remove audit fields from public responses
    return this.normalizeAgencyOutput(
      this.auditService.removeAuditFields(updatedAgency),
    );
  }

  async remove(id: string, user: any) {
    const agency = await this.prisma.agency.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      include: { company: true },
    });

    if (!agency) {
      throw new NotFoundException("Agence introuvable");
    }

    if (user.role === "COMPANY_ADMIN" && agency.companyId !== user.companyId) {
      throw new ForbiddenException(
        "Impossible de supprimer une agence d'une autre société",
      );
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
      throw new ForbiddenException(
        "Permissions insuffisantes : seuls SUPER_ADMIN et COMPANY_ADMIN peuvent supprimer des agences",
      );
    }

    // Store previous state for event log
    const previousState = { ...agency };

    const actorId = user?.id || user?.userId || user?.sub;

    // Soft-delete agency + cleanup user-agency links in one transaction.
    // Then deactivate AGENT/AGENCY_MANAGER users that no longer have any active agency.
    const deleteData = this.auditService.addDeleteAuditFields(
      { status: AgencyStatus.DELETED },
      actorId,
      "Suppression de l’agence",
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.agency.update({
        where: { id },
        data: deleteData,
      });

      await tx.userAgency.deleteMany({
        where: { agencyId: id },
      });

      const orphanUsers = await tx.user.findMany({
        where: {
          companyId: agency.companyId,
          role: { in: [Role.AGENCY_MANAGER, Role.AGENT] },
          isActive: true,
          deletedAt: null,
          userAgencies: {
            none: {
              agency: {
                deletedAt: null,
                status: AgencyStatus.ACTIVE,
              },
            },
          },
        },
        select: { id: true },
      });

      if (orphanUsers.length > 0) {
        await tx.user.updateMany({
          where: {
            id: { in: orphanUsers.map((u) => u.id) },
          },
          data: this.auditService.addUpdateAuditFields(
            { isActive: false },
            actorId,
          ),
        });
      }
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        agency.id,
        "Agency",
        agency.id,
        BusinessEventType.AGENCY_DELETED,
        previousState,
        { ...agency, ...deleteData },
        actorId,
        agency.companyId, // companyId
      )
      .catch((err) =>
        this.logger.error("Error logging agency deletion event:", err),
      );

    return { message: "Agence supprimée avec succès" };
  }
}
