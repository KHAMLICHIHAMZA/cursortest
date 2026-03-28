import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private parseAddressDetails(address?: string | null):
    | {
        line1?: string;
        line2?: string;
        city?: string;
        postalCode?: string;
        country?: string;
      }
    | undefined {
    if (!address) return undefined;
    try {
      const parsed = JSON.parse(address);
      if (parsed && typeof parsed === "object") {
        return {
          line1: typeof parsed.line1 === "string" ? parsed.line1 : undefined,
          line2: typeof parsed.line2 === "string" ? parsed.line2 : undefined,
          city: typeof parsed.city === "string" ? parsed.city : undefined,
          postalCode:
            typeof parsed.postalCode === "string"
              ? parsed.postalCode
              : undefined,
          country:
            typeof parsed.country === "string" ? parsed.country : undefined,
        };
      }
    } catch {
      return {
        line1: address,
      };
    }
    return undefined;
  }

  private getMissingRequiredProfileFields(user: any): string[] {
    if (!user) return [];
    const rolesRequiringCompletion = [
      "COMPANY_ADMIN",
      "AGENCY_MANAGER",
      "AGENT",
    ];
    if (!rolesRequiringCompletion.includes(user.role)) return [];
    const missing: string[] = [];
    const name = String(user.name || "").trim();
    const phone = String(user.phone || "").trim();
    const addressDetails = this.parseAddressDetails(user.address);
    if (!name) missing.push("name");
    if (!phone) missing.push("phone");
    if (!addressDetails?.line1?.trim()) missing.push("address.line1");
    if (!addressDetails?.city?.trim()) missing.push("address.city");
    if (!addressDetails?.postalCode?.trim()) missing.push("address.postalCode");
    if (!addressDetails?.country?.trim()) missing.push("address.country");
    if (!user.dateOfBirth) missing.push("dateOfBirth");
    return missing;
  }

  @Post("login")
  @ApiOperation({ summary: "Login" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user" })
  async getMe(@CurrentUser() user: any) {
    const currentUser = user?.user;
    if (!currentUser) return user;
    const addressDetails = this.parseAddressDetails(currentUser.address);
    const missingProfileFields = this.getMissingRequiredProfileFields(currentUser);
    return {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      companyId: currentUser.companyId || undefined,
      agencyIds: user?.agencyIds || [],
      phone: currentUser.phone || undefined,
      address: currentUser.address || undefined,
      addressDetails,
      dateOfBirth: currentUser.dateOfBirth || undefined,
      profileCompletionRequired: missingProfileFields.length > 0,
      missingProfileFields,
    };
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password with token" })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Send password reset email" })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post("impersonate/:userId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Super Admin: se connecter en tant qu'un autre utilisateur",
  })
  async impersonate(
    @Param("userId") targetUserId: string,
    @CurrentUser() user: any,
  ) {
    // Double guard: controller + service both enforce SUPER_ADMIN
    if (user?.role !== "SUPER_ADMIN") {
      throw new ForbiddenException(
        "Seul un Super Admin peut utiliser l'impersonation",
      );
    }
    return this.authService.impersonate(targetUserId, user.userId);
  }
}
