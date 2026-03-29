import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { userProfileSelect } from "../auth/user-auth.select";
import { PrismaSoftDeleteService } from "../../common/prisma/prisma-soft-delete.service";
import { AuditService } from "../../common/services/audit.service";
import { BusinessEventLogService } from "../business-event-log/business-event-log.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { sendWelcomeEmail } from "../../services/email.service";
import { BusinessEventType } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  private generateResetToken(): string {
    return randomBytes(32).toString("hex");
  }

  private buildArchivedEmail(email: string, userId: string): string {
    const [localPart, domainPart] = email.split("@");
    const safeLocal = localPart || "user";
    const safeDomain = domainPart || "deleted.local";
    const ts = Date.now();
    return `${safeLocal}+deleted-${ts}-${userId.slice(-6)}@${safeDomain}`;
  }

  /**
   * Strip sensitive fields (password, reset tokens) from user objects before returning to client.
   */
  private sanitizeUser<T extends Record<string, any>>(
    user: T,
  ): Omit<T, "password" | "resetToken" | "resetTokenExpiry"> {
    if (!user) return user;
    const { password, resetToken, resetTokenExpiry, ...safe } = user;
    return safe as any;
  }

  private sanitizeUsers<T extends Record<string, any>>(
    users: T[],
  ): Array<Omit<T, "password" | "resetToken" | "resetTokenExpiry">> {
    return users.map((u) => this.sanitizeUser(u));
  }

  private buildAddressStringFromDetails(details?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }): string | null {
    if (!details) return null;
    const normalized = {
      line1: details.line1?.trim() || "",
      line2: details.line2?.trim() || "",
      city: details.city?.trim() || "",
      postalCode: details.postalCode?.trim() || "",
      country: details.country?.trim() || "",
    };
    const hasAny = Object.values(normalized).some((v) => v.length > 0);
    if (!hasAny) return null;
    return JSON.stringify(normalized);
  }

  async findAll(user: any) {
    let users;
    if (user.role === "SUPER_ADMIN") {
      users = await this.prisma.user.findMany({
        where: this.softDeleteService.addSoftDeleteFilter(),
        select: userProfileSelect,
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "COMPANY_ADMIN" && user.companyId) {
      users = await this.prisma.user.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({
          companyId: user.companyId,
        }),
        select: userProfileSelect,
        orderBy: { createdAt: "desc" },
      });
    } else {
      throw new ForbiddenException(
        "Permissions insuffisantes : seuls SUPER_ADMIN et COMPANY_ADMIN peuvent lister les utilisateurs",
      );
    }

    // Remove sensitive and audit fields from public responses
    return this.sanitizeUsers(
      this.auditService.removeAuditFieldsFromArray(users),
    );
  }

  async findAllLight(
    user: any,
    page = 1,
    pageSize = 25,
    q?: string,
    agencyId?: string,
  ) {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.min(Math.max(1, Math.floor(pageSize)), 100)
      : 25;
    const skip = (safePage - 1) * safePageSize;
    const search = q?.trim();
    const normalizedAgencyId = agencyId?.trim();
    if (user.role === "SUPER_ADMIN") {
      const where = this.softDeleteService.addSoftDeleteFilter({
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(normalizedAgencyId
          ? {
              userAgencies: {
                some: { agencyId: normalizedAgencyId },
              },
            }
          : {}),
      });
      const [itemsRaw, total, activeTotal] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: userProfileSelect,
          orderBy: { createdAt: "desc" },
          skip,
          take: safePageSize,
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count({
          where: this.softDeleteService.addSoftDeleteFilter({ isActive: true }),
        }),
      ]);

      const items = this.sanitizeUsers(
        this.auditService.removeAuditFieldsFromArray(itemsRaw),
      );
      const totalPages = Math.max(1, Math.ceil(total / safePageSize));
      return {
        items,
        total,
        activeTotal,
        page: safePage,
        pageSize: safePageSize,
        totalPages,
      };
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId) {
      const where = this.softDeleteService.addSoftDeleteFilter({
        companyId: user.companyId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(normalizedAgencyId
          ? {
              userAgencies: {
                some: { agencyId: normalizedAgencyId },
              },
            }
          : {}),
      });
      const [itemsRaw, total, activeTotal] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: userProfileSelect,
          orderBy: { createdAt: "desc" },
          skip,
          take: safePageSize,
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { ...where, isActive: true } }),
      ]);

      const items = this.sanitizeUsers(
        this.auditService.removeAuditFieldsFromArray(itemsRaw),
      );
      const totalPages = Math.max(1, Math.ceil(total / safePageSize));
      return {
        items,
        total,
        activeTotal,
        page: safePage,
        pageSize: safePageSize,
        totalPages,
      };
    }

    throw new ForbiddenException(
      "Permissions insuffisantes : seuls SUPER_ADMIN et COMPANY_ADMIN peuvent lister les utilisateurs",
    );
  }

  async findOne(id: string, user: any) {
    // Users can see their own profile
    if (id === user.userId || id === user.sub) {
      const self = await this.prisma.user.findUnique({
        where: { id },
        select: userProfileSelect,
      });
      return self ? this.sanitizeUser(self) : null;
    }

    // Check permissions for other users
    if (user.role === "SUPER_ADMIN") {
      const found = await this.prisma.user.findUnique({
        where: { id },
        select: userProfileSelect,
      });
      return found ? this.sanitizeUser(found) : null;
    }

    if (user.role === "COMPANY_ADMIN" && user.companyId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, companyId: true },
      });
      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException("Accès refusé");
      }

      const userWithRelations = await this.prisma.user.findUnique({
        where: { id },
        select: userProfileSelect,
      });
      if (!userWithRelations) {
        throw new NotFoundException("Utilisateur introuvable");
      }

      return this.sanitizeUser(
        this.auditService.removeAuditFields(userWithRelations),
      );
    }

    throw new ForbiddenException("Permissions insuffisantes");
  }

  async create(createUserDto: CreateUserDto, user: any) {
    const { email, name, role, companyId, agencyIds } = createUserDto;

    if (!email || !name || !role) {
      throw new BadRequestException("L'email, le nom et le rôle sont requis");
    }

    const validRoles = ["COMPANY_ADMIN", "AGENCY_MANAGER", "AGENT"];
    if (user.role !== "SUPER_ADMIN" && !validRoles.includes(role)) {
      throw new BadRequestException("Rôle invalide");
    }

    if (
      user.role === "COMPANY_ADMIN" &&
      !["AGENCY_MANAGER", "AGENT"].includes(role)
    ) {
      throw new ForbiddenException(
        "L'administrateur de société ne peut pas créer ce rôle",
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, deletedAt: true },
    });

    if (existingUser) {
      // Soft-deleted users keep their email in DB. To allow re-creating a user
      // with the same email, archive the old email first.
      if (existingUser.deletedAt) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email: this.buildArchivedEmail(existingUser.email, existingUser.id),
          },
          select: { id: true },
        });
      } else {
        throw new BadRequestException(
          "Un utilisateur avec cet email existe déjà",
        );
      }
    }

    let targetCompanyId = companyId || user.companyId;

    if (user.role === "COMPANY_ADMIN") {
      if (companyId && companyId !== user.companyId) {
        throw new ForbiddenException(
          "Impossible de créer un utilisateur pour une autre société",
        );
      }
      targetCompanyId = user.companyId!;
    }

    if (targetCompanyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: targetCompanyId },
      });

      if (!company || !company.isActive) {
        throw new BadRequestException("Société introuvable ou inactive");
      }
    }

    if (agencyIds && agencyIds.length > 0 && targetCompanyId) {
      const agencies = await this.prisma.agency.findMany({
        where: {
          id: { in: agencyIds },
          companyId: targetCompanyId,
        },
      });

      if (agencies.length !== agencyIds.length) {
        throw new BadRequestException(
          "Certaines agences n'appartiennent pas à la société",
        );
      }
    }

    const tempPassword = "temp-password-" + Date.now();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        email,
        password: hashedPassword,
        name,
        role,
        companyId: targetCompanyId || null,
        isActive: true,
      },
      user?.id || user?.userId || user?.sub,
    );

    const newUser = await this.prisma.user.create({
      data: dataWithAudit,
      select: { id: true },
    });

    if (agencyIds && agencyIds.length > 0) {
      await this.prisma.userAgency.createMany({
        data: agencyIds.map((agencyId: string) => ({
          userId: newUser.id,
          agencyId,
        })),
      });
    }

    if (["COMPANY_ADMIN", "AGENCY_MANAGER", "AGENT"].includes(role)) {
      const resetToken = this.generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.prisma.passwordResetToken.create({
        data: {
          userId: newUser.id,
          token: resetToken,
          expiresAt,
        },
      });

      sendWelcomeEmail(email, name, resetToken).catch((emailError) =>
        console.error("Error sending welcome email:", emailError),
      );
    }

    const userWithRelations = await this.prisma.user.findUnique({
      where: { id: newUser.id },
      select: userProfileSelect,
    });

    if (!userWithRelations) {
      throw new Error(
        "Impossible de récupérer l'utilisateur après création. Veuillez réessayer.",
      );
    }

    // Log business event (User doesn't have agencyId, so we use null)
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for User
        "User",
        newUser.id,
        BusinessEventType.USER_CREATED,
        null,
        userWithRelations,
        user?.id || user?.userId || user?.sub,
        userWithRelations.companyId || null,
      )
      .catch((err) => console.error("Error logging user creation event:", err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(userWithRelations);
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: userProfileSelect,
    });

    if (!targetUser) {
      throw new NotFoundException("Utilisateur introuvable");
    }

    if (
      user.role === "COMPANY_ADMIN" &&
      targetUser.companyId !== user.companyId
    ) {
      throw new ForbiddenException(
        "Impossible de mettre à jour un utilisateur d'une autre société",
      );
    }

    // --- Self-modification protections ---
    const currentUserId = user.id || user.userId || user.sub;
    const isSelf = currentUserId === id;

    if (isSelf) {
      // Prevent self role change
      if (
        updateUserDto.role !== undefined &&
        updateUserDto.role !== targetUser.role
      ) {
        throw new ForbiddenException(
          "Vous ne pouvez pas modifier votre propre rôle. Contactez un administrateur supérieur.",
        );
      }
      // Prevent self deactivation
      if (updateUserDto.isActive === false) {
        throw new ForbiddenException(
          "Vous ne pouvez pas désactiver votre propre compte.",
        );
      }
    }

    // Store previous state for event log
    const previousState = { ...targetUser };

    const updateData: any = {};
    if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
    if (updateUserDto.role !== undefined) {
      if (user.role === "COMPANY_ADMIN") {
        // Si le rôle envoyé est le même que l'actuel, on ignore (pas de changement)
        if (updateUserDto.role === targetUser.role) {
          // Pas de changement de rôle, on ne fait rien
        } else if (!["AGENCY_MANAGER", "AGENT"].includes(updateUserDto.role)) {
          throw new ForbiddenException(
            `Vous ne pouvez pas attribuer le rôle "${updateUserDto.role}". ` +
              `Les rôles autorisés sont : Gestionnaire d'agence (AGENCY_MANAGER) et Agent (AGENT).`,
          );
        } else {
          updateData.role = updateUserDto.role;
        }
      } else if (user.role === "SUPER_ADMIN") {
        updateData.role = updateUserDto.role;
      }
    }
    if (updateUserDto.isActive !== undefined)
      updateData.isActive = updateUserDto.isActive;

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(
      updateData,
      user?.id || user?.userId || user?.sub,
    );

    await this.prisma.user.update({
      where: { id },
      data: dataWithAudit,
      select: { id: true },
    });

    if (updateUserDto.agencyIds !== undefined) {
      await this.prisma.userAgency.deleteMany({
        where: { userId: id },
      });

      if (updateUserDto.agencyIds.length > 0) {
        await this.prisma.userAgency.createMany({
          data: updateUserDto.agencyIds.map((agencyId: string) => ({
            userId: id,
            agencyId,
          })),
        });
      }
    }

    const updatedUser = await this.prisma.user.findUnique({
      where: { id },
      select: userProfileSelect,
    });

    if (!updatedUser) {
      throw new NotFoundException("Utilisateur introuvable");
    }

    // Log business event
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for User
        "User",
        updatedUser.id,
        BusinessEventType.USER_UPDATED,
        previousState,
        updatedUser,
        user?.id || user?.userId || user?.sub,
        updatedUser.companyId || null, // companyId
      )
      .catch((err) => console.error("Error logging user update event:", err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(updatedUser);
  }

  async resetPassword(id: string, user: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException("Utilisateur introuvable");
    }

    if (
      user.role === "COMPANY_ADMIN" &&
      targetUser.companyId !== user.companyId
    ) {
      throw new ForbiddenException(
        "Impossible de réinitialiser le mot de passe pour un utilisateur d'une autre société",
      );
    }

    if (
      user.role === "COMPANY_ADMIN" &&
      targetUser.role === "COMPANY_ADMIN" &&
      targetUser.id !== user.sub
    ) {
      throw new ForbiddenException(
        "Impossible de réinitialiser le mot de passe d'un autre administrateur",
      );
    }

    const resetToken = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: targetUser.id,
        token: resetToken,
        expiresAt,
      },
    });

    sendWelcomeEmail(targetUser.email, targetUser.name, resetToken).catch(
      (emailError) => console.error("Error sending reset email:", emailError),
    );

    return { message: "Email de réinitialisation du mot de passe envoyé" };
  }

  async remove(id: string, user: any, reason?: string) {
    if (user.role !== "SUPER_ADMIN") {
      throw new ForbiddenException(
        "Seul SUPER_ADMIN peut supprimer des utilisateurs",
      );
    }

    // Prevent self-deletion
    const currentUserId = user.id || user.userId || user.sub;
    if (currentUserId === id) {
      throw new ForbiddenException(
        "Vous ne pouvez pas supprimer votre propre compte",
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      select: userProfileSelect,
    });

    if (!targetUser) {
      throw new NotFoundException("Utilisateur introuvable");
    }

    // Store previous state for event log
    const previousState = { ...targetUser };

    // Add delete audit fields
    const deleteData = this.auditService.addDeleteAuditFields(
      {
        isActive: false,
        email: this.buildArchivedEmail(targetUser.email, targetUser.id),
      },
      user?.id || user?.userId || user?.sub,
      reason,
    );

    await this.prisma.user.update({
      where: { id },
      data: deleteData,
      select: { id: true },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for User
        "User",
        targetUser.id,
        BusinessEventType.USER_DELETED,
        previousState,
        { ...targetUser, ...deleteData },
        user?.id || user?.userId || user?.sub,
        targetUser.companyId || null, // companyId
      )
      .catch((err) => console.error("Error logging user deletion event:", err));

    return { message: "Utilisateur supprimé avec succès" };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      address?: string;
      addressDetails?: {
        line1?: string;
        line2?: string;
        city?: string;
        postalCode?: string;
        country?: string;
      };
      dateOfBirth?: Date;
    },
  ) {
    const updateData: {
      name?: string;
      phone?: string;
      address?: string;
      dateOfBirth?: Date;
    } = {};

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) {
        throw new BadRequestException("Le nom est requis");
      }
      updateData.name = trimmed;
    }
    if (data.phone !== undefined) {
      const trimmed = data.phone.trim();
      if (!trimmed) {
        throw new BadRequestException("Le téléphone est requis");
      }
      updateData.phone = trimmed;
    }
    if (data.address !== undefined) {
      const trimmed = data.address.trim();
      if (!trimmed) {
        throw new BadRequestException("L’adresse est requise");
      }
      updateData.address = trimmed;
    }
    if (data.addressDetails !== undefined) {
      const line1 = data.addressDetails.line1?.trim() || "";
      const city = data.addressDetails.city?.trim() || "";
      const postalCode = data.addressDetails.postalCode?.trim() || "";
      const country = data.addressDetails.country?.trim() || "";
      if (!line1 || !city || !postalCode || !country) {
        throw new BadRequestException(
          "Adresse incomplète: ligne 1, ville, code postal et pays sont requis",
        );
      }
      const addressString = this.buildAddressStringFromDetails(
        data.addressDetails,
      );
      updateData.address = addressString || "";
    }
    if (data.dateOfBirth !== undefined) {
      if (Number.isNaN(data.dateOfBirth.getTime())) {
        throw new BadRequestException("Date de naissance invalide");
      }
      const now = new Date();
      if (data.dateOfBirth > now) {
        throw new BadRequestException(
          "La date de naissance ne peut pas être dans le futur",
        );
      }
      updateData.dateOfBirth = data.dateOfBirth;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userProfileSelect,
    });
    return this.auditService.removeAuditFields(updated);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new ForbiddenException("Mot de passe actuel incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true },
    });

    return { message: "Mot de passe modifié avec succès" };
  }
}
