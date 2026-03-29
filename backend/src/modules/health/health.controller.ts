import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** GET /api/v1 — pas de handler avant : le client voyait un 404 sur l’URL « base » de l’API. */
  @Get()
  @ApiOperation({ summary: "Racine API — liens utiles" })
  getApiRoot() {
    return {
      service: "MalocAuto API",
      version: "2.0.0",
      health: "/api/v1/health",
      ready: "/api/v1/ready",
      authLogin: "POST /api/v1/auth/login",
    };
  }

  @Get("health")
  @ApiOperation({ summary: "Liveness probe" })
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe (DB check)" })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get("metrics/http")
  @ApiOperation({ summary: "HTTP latency and 5xx metrics (p50/p95/p99)" })
  getHttpMetrics() {
    return this.healthService.getHttpMetrics();
  }
}
