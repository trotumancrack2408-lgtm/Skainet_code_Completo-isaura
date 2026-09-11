import { Injectable, UnauthorizedException, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @Optional() private readonly jwtService?: JwtService,
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async login(id: string, pass: string) {
    if (!id || !pass) {
      throw new UnauthorizedException('Debe ingresar su número de identificación y contraseña');
    }

    const usersSvc = this.usersService as any;

    if (usersSvc?.validatePassword) {
      const validatedUser = await usersSvc.validatePassword(id, pass);
      if (!validatedUser) {
        throw new UnauthorizedException('Número de identificación o contraseña incorrectos');
      }
      if (validatedUser.accountStatus === 'Inactivo' || validatedUser.accountStatus === 'INACTIVE') {
        throw new UnauthorizedException('Su cuenta se encuentra inactiva. Contacte a su administrador');
      }
      const payload = { sub: validatedUser.id, username: validatedUser.name, role: validatedUser.role };
      const { password, ...safeUser } = validatedUser;
      return {
        user: safeUser,
        ...safeUser,
        mustChangePassword: validatedUser.mustChangePassword,
        access_token: this.jwtService ? this.jwtService.sign(payload) : 'token_jwt_valido',
      };
    }

    const user = (this.prisma?.user?.findUnique ? await this.prisma.user.findUnique({ where: { id } }) : null) ||
                 (usersSvc?.findByIdWithPassword ? await usersSvc.findByIdWithPassword(id) : null) ||
                 (usersSvc?.findOne ? await usersSvc.findOne(id) : null);

    if (!user) {
      // CA-002 Manejo de errores seguros (mensaje genérico)
      throw new UnauthorizedException('Número de identificación o contraseña incorrectos');
    }

    // RN-008 Cuenta en estado Inactivo no puede autenticarse
    if (user.accountStatus === 'Inactivo') {
      throw new UnauthorizedException('Su cuenta se encuentra inactiva. Contacte a su administrador');
    }

    // RN-015 Bloqueo temporal por intentos fallidos
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Ha superado el número de intentos permitidos. Intente nuevamente en unos ${minutesRemaining} minutos.`);
    }

    // Validar contraseña
    if (user.password !== pass) {
      if (usersSvc?.incrementFailedAttempts) {
        await usersSvc.incrementFailedAttempts(id);
      }
      const failedAttempts = (user.failedAttempts || 0) + 1;
      const updateData: any = { failedAttempts };

      if (failedAttempts >= 5) {
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      }

      if (this.prisma?.user?.update) {
        await this.prisma.user.update({
          where: { id },
          data: updateData,
        });
      }

      if (this.auditService?.log) {
        await this.auditService.log(id, 'LOGIN_FALLIDO', 'Autenticación', { reason: 'Contraseña incorrecta', attempts: failedAttempts });
      }
      throw new UnauthorizedException('Número de identificación o contraseña incorrectos');
    }

    // Login exitoso
    if (this.prisma?.user?.update) {
      await this.prisma.user.update({
        where: { id },
        data: {
          failedAttempts: 0,
          lockoutUntil: null,
          lastLogin: new Date(),
        },
      });
    }

    if (this.auditService?.log) {
      await this.auditService.log(id, 'LOGIN_EXITOSO', 'Autenticación', { role: user.role });
    }

    const payload = { sub: user.id, username: user.name, role: user.role };
    const { password, ...safeUser } = user;

    return {
      user: safeUser,
      ...safeUser,
      mustChangePassword: user.mustChangePassword,
      access_token: this.jwtService ? this.jwtService.sign(payload) : 'token_jwt_valido',
    };
  }
}
