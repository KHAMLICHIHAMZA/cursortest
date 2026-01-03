import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Service helper pour gérer le soft delete de manière cohérente
 */
@Injectable()
export class PrismaSoftDeleteService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ajoute le filtre soft delete à une requête
   */
  addSoftDeleteFilter(where: any = {}) {
    return {
      ...where,
      deletedAt: null,
    };
  }

  /**
   * Soft delete un enregistrement
   */
  async softDelete(model: string, id: string) {
    const modelName = model.charAt(0).toLowerCase() + model.slice(1);
    return (this.prisma as any)[modelName].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restaurer un enregistrement soft deleted
   */
  async restore(model: string, id: string) {
    const modelName = model.charAt(0).toLowerCase() + model.slice(1);
    return (this.prisma as any)[modelName].update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Hard delete (suppression physique) - À utiliser avec précaution
   */
  async hardDelete(model: string, id: string) {
    const modelName = model.charAt(0).toLowerCase() + model.slice(1);
    return (this.prisma as any)[modelName].delete({
      where: { id },
    });
  }
}





