import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { getHttpMetricsSnapshot } from "../../common/observability/http-metrics.store";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
    };
  }

  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ready",
        db: "up",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "not_ready",
        db: "down",
        reason: (error as Error)?.message || "Database unavailable",
        timestamp: new Date().toISOString(),
      };
    }
  }

  getHttpMetrics() {
    return getHttpMetricsSnapshot();
  }
}
