import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BookingService } from "./booking.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { CheckInDto } from "./dto/check-in.dto";
import { CheckOutDto } from "./dto/check-out.dto";
import { OverrideLateFeeDto } from "./dto/override-late-fee.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  PermissionGuard,
  Permissions,
} from "../../common/guards/permission.guard";
import { ReadOnlyGuard } from "../../common/guards/read-only.guard";
import { RequireModuleGuard } from "../../common/guards/require-module.guard";
import { RequireActiveCompanyGuard } from "../../common/guards/require-active-company.guard";
import { RequireActiveAgencyGuard } from "../../common/guards/require-active-agency.guard";
import { RequirePermissionGuard } from "../../common/guards/require-permission.guard";
import { RequireModule } from "../../common/guards/require-module.guard";
import { RequirePermission } from "../../common/decorators/permission.decorator";
import { ModuleCode, UserAgencyPermission } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Bookings")
@Controller("bookings")
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.BOOKINGS)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Booking management (create/update/delete) is restricted to manager-level roles.
   * AGENT can still perform field operations (check-in/check-out).
   */
  private assertCanManageBookings(user: any) {
    const allowedRoles = ["SUPER_ADMIN", "COMPANY_ADMIN", "AGENCY_MANAGER"];
    if (!allowedRoles.includes(user?.role)) {
      throw new ForbiddenException(
        "Seuls les gestionnaires peuvent créer ou modifier les réservations",
      );
    }
  }

  /**
   * Financial closure is an agency-level operation.
   * Allowed: AGENCY_MANAGER (+ SUPER_ADMIN for emergency/admin support).
   */
  private assertCanRunFinancialClosure(user: any) {
    const allowedRoles = ["AGENCY_MANAGER", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user?.role)) {
      throw new ForbiddenException(
        "La clôture financière est réservée aux responsables d'agence",
      );
    }
  }

  @Post()
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions("bookings:create")
  @ApiOperation({ summary: "Create a new booking" })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: any,
  ) {
    this.assertCanManageBookings(user);
    return this.bookingService.create(createBookingDto, user.userId, user);
  }

  @Get()
  @Permissions("bookings:read")
  @ApiOperation({ summary: "Get all bookings" })
  async findAll(@Query() filters: any, @CurrentUser() user: any) {
    return this.bookingService.findAll(user, filters);
  }

  @Get("light")
  @Permissions("bookings:read")
  @ApiOperation({ summary: "Get lightweight paginated bookings list" })
  async findAllLight(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("agencyId") agencyId?: string,
    @Query("vehicleId") vehicleId?: string,
    @Query("clientId") clientId?: string,
    @Query("status") status?: string,
    @Query("bookingNumber") bookingNumber?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedPageSize = pageSize ? Number(pageSize) : 20;
    return this.bookingService.findAllLight(user, parsedPage, parsedPageSize, {
      agencyId,
      vehicleId,
      clientId,
      status,
      bookingNumber,
    });
  }

  @Get("summary")
  @Permissions("bookings:read")
  @ApiOperation({ summary: "Get bookings KPI summary (optimized)" })
  async getSummary(
    @CurrentUser() user: any,
    @Query("agencyId") agencyId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.bookingService.getSummary(user, {
      agencyId,
      startDate,
      endDate,
    });
  }

  @Get(":id")
  @Permissions("bookings:read")
  @ApiOperation({ summary: "Get a booking by ID" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.bookingService.findOne(id, user);
  }

  @Patch(":id")
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions("bookings:update")
  @ApiOperation({ summary: "Update a booking" })
  async update(
    @Param("id") id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() user: any,
  ) {
    this.assertCanManageBookings(user);
    return this.bookingService.update(id, updateBookingDto, user.userId);
  }

  @Delete(":id")
  @Permissions("bookings:delete")
  @ApiOperation({ summary: "Delete a booking" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    this.assertCanManageBookings(user);
    return this.bookingService.remove(id, user);
  }

  @Post(":id/checkin")
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions("bookings:update")
  @ApiOperation({
    summary: "Check-in (CONFIRMED ou PICKUP_LATE → IN_PROGRESS)",
  })
  async checkIn(
    @Param("id") id: string,
    @Body() checkInDto: CheckInDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.checkIn(id, checkInDto, user.userId);
  }

  @Post(":id/checkout")
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions("bookings:update")
  @ApiOperation({ summary: "Check-out a booking (IN_PROGRESS -> RETURNED)" })
  async checkOut(
    @Param("id") id: string,
    @Body() checkOutDto: CheckOutDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.checkOut(id, checkOutDto, user.userId);
  }

  @Post(":id/financial-closure")
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions("bookings:update")
  @ApiOperation({
    summary: "Financial closure of a booking (bloqué si litige DISPUTED)",
  })
  async financialClosure(@Param("id") id: string, @CurrentUser() user: any) {
    this.assertCanRunFinancialClosure(user);
    return this.bookingService.financialClosure(id, user.userId);
  }

  @Patch(":id/late-fee")
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions("bookings:update")
  @ApiOperation({
    summary:
      "Override late fee (AGENCY_MANAGER, COMPANY_ADMIN, SUPER_ADMIN — avec justification)",
  })
  async overrideLateFee(
    @Param("id") id: string,
    @Body() overrideDto: OverrideLateFeeDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.overrideLateFee(id, overrideDto, user.userId);
  }
}
