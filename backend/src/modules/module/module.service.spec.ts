import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ModuleService } from './module.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ModuleCode } from '@prisma/client';

describe('ModuleService', () => {
  let service: ModuleService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
    },
    agency: {
      findUnique: jest.fn(),
    },
    companyModule: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    agencyModule: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    moduleDependency: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ModuleService>(ModuleService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('activateCompanyModule', () => {
    const companyId = 'company-1';
    const moduleCode = ModuleCode.VEHICLES;
    const superAdmin = { userId: 'user-1', role: 'SUPER_ADMIN' };
    const companyAdmin = { userId: 'user-2', role: 'COMPANY_ADMIN' };

    it('should throw ForbiddenException if user is not SUPER_ADMIN', async () => {
      await expect(
        service.activateCompanyModule(companyId, moduleCode, companyAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(
        service.activateCompanyModule(companyId, moduleCode, superAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if dependencies are not met', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: companyId });
      mockPrismaService.moduleDependency.findMany.mockResolvedValue([
        { moduleCode, dependsOnCode: ModuleCode.BOOKINGS },
      ]);
      mockPrismaService.companyModule.findUnique.mockResolvedValue(null);

      await expect(
        service.activateCompanyModule(companyId, moduleCode, superAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should activate company module successfully', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: companyId });
      mockPrismaService.moduleDependency.findMany.mockResolvedValue([]);
      mockPrismaService.companyModule.upsert.mockResolvedValue({
        companyId,
        moduleCode,
        isActive: true,
      });

      const result = await service.activateCompanyModule(companyId, moduleCode, superAdmin);

      expect(result).toEqual({
        companyId,
        moduleCode,
        isActive: true,
      });
      expect(mockPrismaService.companyModule.upsert).toHaveBeenCalledWith({
        where: {
          companyId_moduleCode: { companyId, moduleCode },
        },
        create: {
          companyId,
          moduleCode,
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });
    });
  });

  describe('deactivateCompanyModule', () => {
    const companyId = 'company-1';
    const moduleCode = ModuleCode.VEHICLES;
    const superAdmin = { userId: 'user-1', role: 'SUPER_ADMIN' };

    it('should throw NotFoundException if company module not found', async () => {
      mockPrismaService.companyModule.findUnique.mockResolvedValue(null);

      await expect(
        service.deactivateCompanyModule(companyId, moduleCode, superAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reverse dependencies exist', async () => {
      mockPrismaService.companyModule.findUnique.mockResolvedValue({
        companyId,
        moduleCode,
        isActive: true,
      });
      mockPrismaService.moduleDependency.findMany.mockResolvedValue([
        { moduleCode: ModuleCode.BOOKINGS, dependsOnCode: moduleCode },
      ]);
      mockPrismaService.companyModule.findMany.mockResolvedValue([
        { companyId, moduleCode: ModuleCode.BOOKINGS, isActive: true },
      ]);

      await expect(
        service.deactivateCompanyModule(companyId, moduleCode, superAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should deactivate company module successfully', async () => {
      mockPrismaService.companyModule.findUnique.mockResolvedValue({
        companyId,
        moduleCode,
        isActive: true,
      });
      mockPrismaService.moduleDependency.findMany.mockResolvedValue([]);
      mockPrismaService.companyModule.update.mockResolvedValue({
        companyId,
        moduleCode,
        isActive: false,
      });

      const result = await service.deactivateCompanyModule(companyId, moduleCode, superAdmin);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.companyModule.update).toHaveBeenCalled();
    });
  });

  describe('activateAgencyModule', () => {
    const agencyId = 'agency-1';
    const companyId = 'company-1';
    const moduleCode = ModuleCode.VEHICLES;
    const companyAdmin = { userId: 'user-2', role: 'COMPANY_ADMIN', companyId };

    it('should throw NotFoundException if agency not found', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(null);

      await expect(
        service.activateAgencyModule(agencyId, moduleCode, companyAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if agency does not belong to user company', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: agencyId,
        companyId: 'other-company',
        company: { id: 'other-company' },
      });

      await expect(
        service.activateAgencyModule(agencyId, moduleCode, companyAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if module is not paid at company level', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: agencyId,
        companyId,
        company: { id: companyId },
      });
      mockPrismaService.companyModule.findUnique.mockResolvedValue(null);

      await expect(
        service.activateAgencyModule(agencyId, moduleCode, companyAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should activate agency module successfully', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: agencyId,
        companyId,
        company: { id: companyId },
      });
      mockPrismaService.companyModule.findUnique.mockResolvedValue({
        companyId,
        moduleCode,
        isActive: true,
      });
      mockPrismaService.moduleDependency.findMany.mockResolvedValue([]);
      mockPrismaService.agencyModule.upsert.mockResolvedValue({
        agencyId,
        moduleCode,
        isActive: true,
      });

      const result = await service.activateAgencyModule(agencyId, moduleCode, companyAdmin);

      expect(result).toEqual({
        agencyId,
        moduleCode,
        isActive: true,
      });
      expect(mockPrismaService.agencyModule.upsert).toHaveBeenCalled();
    });
  });

  describe('deactivateAgencyModule', () => {
    const agencyId = 'agency-1';
    const companyId = 'company-1';
    const moduleCode = ModuleCode.VEHICLES;
    const companyAdmin = { userId: 'user-2', role: 'COMPANY_ADMIN', companyId };

    it('should throw NotFoundException if agency module not found', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: agencyId,
        companyId,
      });
      mockPrismaService.agencyModule.findUnique.mockResolvedValue(null);

      await expect(
        service.deactivateAgencyModule(agencyId, moduleCode, companyAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should deactivate agency module successfully', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: agencyId,
        companyId,
      });
      mockPrismaService.agencyModule.findUnique.mockResolvedValue({
        agencyId,
        moduleCode,
        isActive: true,
      });
      mockPrismaService.moduleDependency.findMany.mockResolvedValue([]);
      mockPrismaService.agencyModule.update.mockResolvedValue({
        agencyId,
        moduleCode,
        isActive: false,
      });

      const result = await service.deactivateAgencyModule(agencyId, moduleCode, companyAdmin);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.agencyModule.update).toHaveBeenCalled();
    });
  });

  describe('getCompanyModules', () => {
    const companyId = 'company-1';
    const superAdmin = { userId: 'user-1', role: 'SUPER_ADMIN' };
    const companyAdmin = { userId: 'user-2', role: 'COMPANY_ADMIN', companyId };

    it('should throw ForbiddenException if user does not have access', async () => {
      const otherAdmin = { userId: 'user-3', role: 'COMPANY_ADMIN', companyId: 'other-company' };

      await expect(service.getCompanyModules(companyId, otherAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return company modules for SUPER_ADMIN', async () => {
      const modules = [
        { companyId, moduleCode: ModuleCode.VEHICLES, isActive: true },
        { companyId, moduleCode: ModuleCode.BOOKINGS, isActive: true },
      ];
      mockPrismaService.companyModule.findMany.mockResolvedValue(modules);

      const result = await service.getCompanyModules(companyId, superAdmin);

      expect(result).toEqual(modules);
      expect(mockPrismaService.companyModule.findMany).toHaveBeenCalledWith({
        where: { companyId },
        orderBy: { moduleCode: 'asc' },
      });
    });
  });

  describe('getAgencyModules', () => {
    const agencyId = 'agency-1';
    const companyId = 'company-1';
    const companyAdmin = { userId: 'user-2', role: 'COMPANY_ADMIN', companyId };

    it('should throw NotFoundException if agency not found', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(null);

      await expect(service.getAgencyModules(agencyId, companyAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return active modules combining company and agency modules', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: agencyId,
        companyId,
      });
      mockPrismaService.companyModule.findMany.mockResolvedValue([
        { companyId, moduleCode: ModuleCode.VEHICLES, isActive: true },
        { companyId, moduleCode: ModuleCode.BOOKINGS, isActive: true },
      ]);
      mockPrismaService.agencyModule.findMany.mockResolvedValue([
        { agencyId, moduleCode: ModuleCode.BOOKINGS, isActive: false },
      ]);

      const result = await service.getAgencyModules(agencyId, companyAdmin);

      expect(result).toHaveLength(1);
      expect(result[0].moduleCode).toBe(ModuleCode.VEHICLES);
      expect(result[0].isActive).toBe(true);
    });
  });
});


