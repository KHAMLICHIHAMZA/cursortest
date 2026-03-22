import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CompanyService } from "./company.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { InitializeCompanySubscriptionDto } from "./dto/initialize-company-subscription.dto";
import { UpdateCompanySubscriptionDto } from "./dto/update-company-subscription.dto";
import { UpdateCompanySettingsDto } from "./dto/update-company-settings.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ReadOnlyGuard } from "../../common/guards/read-only.guard";
import { UseInterceptors } from "@nestjs/common";
import { AuditInterceptor } from "../../common/interceptors/audit.interceptor";

@ApiTags("Companies")
@Controller("companies")
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Get all companies (SUPER_ADMIN only)" })
  async findAll() {
    return this.companyService.findAll();
  }

  @Get("recent")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Get recent companies (SUPER_ADMIN only)" })
  async findRecent(@Query("limit") limit?: string) {
    const parsed = limit ? Number(limit) : 5;
    return this.companyService.findRecent(parsed);
  }

  @Get("admin-stats")
  @Roles("SUPER_ADMIN")
  @ApiOperation({
    summary: "Get lightweight admin dashboard stats (SUPER_ADMIN only)",
  })
  async getAdminStats() {
    return this.companyService.getAdminStats();
  }

  @Get("light")
  @Roles("SUPER_ADMIN")
  @ApiOperation({
    summary: "Get lightweight paginated companies list (SUPER_ADMIN only)",
  })
  async findAllLight(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedPageSize = pageSize ? Number(pageSize) : 25;
    return this.companyService.findAllLight(parsedPage, parsedPageSize, q);
  }

  @Get("lookup")
  @Roles("SUPER_ADMIN")
  @ApiOperation({
    summary: "Get lightweight company lookup list (SUPER_ADMIN only)",
  })
  async findAllLookup() {
    return this.companyService.findAllLookup();
  }

  @Get(":id/summary")
  @Roles("SUPER_ADMIN")
  @ApiOperation({
    summary: "Get lightweight company summary by ID (SUPER_ADMIN only)",
  })
  async findSummary(@Param("id") id: string) {
    return this.companyService.findSummary(id);
  }

  @Get("me")
  @Roles("COMPANY_ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Get my company (Company Admin)" })
  async findMyCompany(@CurrentUser() user: any) {
    return this.companyService.findMyCompany(user);
  }

  @Patch("me/settings")
  @Roles("COMPANY_ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Update my company settings (V2)" })
  async updateMyCompanySettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.companyService.updateMyCompanySettings(user, dto);
  }

  @Get(":id")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Get company by ID" })
  async findOne(@Param("id") id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Create a new company" })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.create(createCompanyDto, user);
  }

  @Post(":id/initial-subscription")
  @Roles("SUPER_ADMIN")
  @ApiOperation({
    summary: "Initialize company plan/subscription after company creation",
  })
  async initializeSubscription(
    @Param("id") id: string,
    @Body() dto: InitializeCompanySubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.initializeSubscription(id, dto, user);
  }

  @Patch(":id/subscription-config")
  @Roles("SUPER_ADMIN")
  @ApiOperation({
    summary:
      "Update company subscription config (plan/agencies/additional modules)",
  })
  async updateSubscriptionConfig(
    @Param("id") id: string,
    @Body() dto: UpdateCompanySubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.updateSubscriptionConfig(id, dto, user);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Update a company" })
  async update(
    @Param("id") id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.update(id, updateCompanyDto, user);
  }

  @Delete(":id")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Delete a company" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.companyService.remove(id, user);
  }
}
