import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    // Un token emitido antes de una desactivación no debe conservar acceso.
    // La cuenta se consulta en cada solicitud autenticada para invalidarlo de inmediato.
    if (!user || user.accountStatus === 'Inactivo' || user.accountStatus === 'INACTIVE') {
      throw new UnauthorizedException('Su sesión ya no está disponible. Contacte a su administrador.');
    }
    // Mantener `sub` disponible para los controladores, además del perfil público.
    return { ...user, sub: user.id };
  }
}
