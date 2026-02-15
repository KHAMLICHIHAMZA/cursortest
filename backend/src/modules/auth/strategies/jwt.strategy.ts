import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        company: true,
        userAgencies: {
          include: {
            agency: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session invalide ou compte désactivé. Veuillez vous reconnecter.');
    }

    // Note: Les règles métier SaaS (company suspended/inactive, etc.) sont gérées
    // par des guards dédiés (RequireActiveCompanyGuard) pour retourner 403 (pas 401).

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      agencyIds: user.userAgencies.map(ua => ua.agencyId),
      userAgencies: user.userAgencies.map(ua => ({
        agencyId: ua.agencyId,
        permission: ua.permission,
      })),
      user,
    };
  }
}





