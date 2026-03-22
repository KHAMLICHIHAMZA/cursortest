import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

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
