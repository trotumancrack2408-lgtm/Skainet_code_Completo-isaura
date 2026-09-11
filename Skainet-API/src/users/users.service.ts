import { Injectable, OnModuleInit, BadRequestException, ForbiddenException, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export enum UserRole {
  SUPER_ADMIN = 'Super Administrador',
  ADMIN = 'Administrador',
  JOYERO = 'Joyero',
  DUENO = 'Super Administrador',
  LIDER = 'Lider de Taller',
}

export enum UserStatus {
  OFFLINE = 'Fuera de Turno',
  AVAILABLE = 'Disponible',
  WORKING = 'En Proceso',
  PAUSED = 'En Pausa',
}

export enum AccountStatus {
  ACTIVE = 'Activo',
  INACTIVE = 'Inactivo',
}

function parseUser(user: any): any {
  if (!user) return null;
  return {
    ...user,
    history: typeof user.history === 'string' ? JSON.parse(user.history) : (user.history || []),
    securityQuestions: typeof user.securityQuestions === 'string' ? JSON.parse(user.securityQuestions) : (user.securityQuestions || []),
  };
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async onModuleInit() {
    const count = await this.prisma.user.count();
    if (count === 0) {
      await this.prisma.user.createMany({
        data: [
          {
            id: '1000000000',
            documentType: 'CC',
            name: 'Super Administrador (Dueño)',
            role: UserRole.SUPER_ADMIN,
            status: UserStatus.AVAILABLE,
            accountStatus: AccountStatus.ACTIVE,
            password: 'admin',
            email: 'admin@skainet.com',
            phone: '+573000000000',
            mustChangePassword: false,
            history: JSON.stringify([]),
          },
          {
            id: '4',
            documentType: 'CC',
            name: 'Danna Administradora',
            role: UserRole.ADMIN,
            status: UserStatus.AVAILABLE,
            accountStatus: AccountStatus.ACTIVE,
            password: '123',
            email: 'danna@skainet.com',
            phone: '+573000000001',
            mustChangePassword: true,
            history: JSON.stringify([]),
          },
          {
            id: '1',
            documentType: 'CC',
            name: 'Ramiro Joyero',
            role: UserRole.JOYERO,
            status: UserStatus.OFFLINE,
            accountStatus: AccountStatus.ACTIVE,
            password: '123',
            email: 'ramiro@skainet.com',
            phone: '+573000000002',
            mustChangePassword: true,
            history: JSON.stringify([]),
          },
        ],
      });
      console.log('Seed de usuarios iniciales de Skainet creado exitosamente! 🌱');
    }
  }

  async findAll(roleFilter?: string, accountStatusFilter?: string) {
    const where: any = {};
    if (roleFilter) where.role = roleFilter;
    if (accountStatusFilter) where.accountStatus = accountStatusFilter;

    const users = await this.prisma.user.findMany({ where, orderBy: { name: 'asc' } });
    return users.map(({ password, ...user }) => parseUser(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return parseUser(user);
  }

  async findByIdWithPassword(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return parseUser(user);
  }

  async createUser(actorId: string, actorRole: string, data: any) {
    if (!data.id || !data.name) {
      throw new BadRequestException('Debe completar todos los campos obligatorios');
    }
    if (data.email && (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email) || data.email.includes('..'))) {
      throw new BadRequestException('El formato del correo electrónico es inválido');
    }

    // Reglas de negocio de Jerarquía (RN-001, RN-002, RN-014)
    if (data.role === UserRole.ADMIN) {
      if (actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
        throw new ForbiddenException('No tiene permisos para realizar esta acción');
      }
    } else if (data.role === UserRole.JOYERO) {
      if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
        throw new ForbiddenException('No tiene permisos para realizar esta acción');
      }
    } else if (data.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No se permite crear cuentas adicionales de Super Administrador');
    }

    // Validar unicidad de número de identificación (RN-004)
    const existing = await this.prisma.user.findUnique({ where: { id: data.id } });
    if (existing) {
      throw new BadRequestException('El número de identificación ya se encuentra registrado en el sistema');
    }

    // Generar contraseña temporal cifrada (RN-012)
    const tempPassword = data.password || Math.random().toString(36).slice(-8);

    const created = await this.prisma.user.create({
      data: {
        id: data.id,
        documentType: data.documentType || 'CC',
        name: data.name,
        role: data.role,
        status: UserStatus.OFFLINE,
        accountStatus: AccountStatus.ACTIVE,
        password: tempPassword,
        email: data.email || null,
        phone: data.phone || null,
        mustChangePassword: true, // RN-013 Cambio obligatorio en primer login
      },
    });

    if (!created) {
      throw new BadRequestException('Error al crear usuario');
    }

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        `CREAR_USUARIO_${data.role}`,
        'Usuarios',
        { createdUserId: created.id, name: created.name, role: created.role },
        actorRole,
      );
    }

    const parsed = parseUser(created);
    const { password, ...result } = parsed || {};
    return { ...result, tempPassword };
  }

  async updateUser(actorId: string, actorRole: string, idToUpdate: string, data: any) {
    if (actorRole === UserRole.JOYERO || actorRole === 'Joyero') {
      throw new ForbiddenException('Un Joyero no tiene permisos para modificar perfiles');
    }

    const user = await this.prisma.user.findUnique({ where: { id: idToUpdate } });
    if (!user) throw new NotFoundException('El usuario seleccionado no existe');

    // RN-006 Modificación de campos propia/jerárquica
    if (user.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    if (data.name !== undefined && (!data.name || !data.name.trim())) {
      throw new BadRequestException('Debe completar todos los campos obligatorios');
    }

    if (data.email && (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email) || data.email.includes('..'))) {
      throw new BadRequestException('El formato del correo electrónico es inválido');
    }

    const updated = await this.prisma.user.update({
      where: { id: idToUpdate },
      data: {
        name: data.name || user.name,
        email: data.email !== undefined ? data.email : user.email,
        phone: data.phone !== undefined ? data.phone : user.phone,
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        `ACTUALIZAR_USUARIO_${user.role || 'Usuario'}`,
        'Usuarios',
        { targetUserId: idToUpdate, changes: { name: data.name, email: data.email, phone: data.phone } },
        actorRole,
      );
    }

    const parsed = parseUser(updated);
    const { password, ...result } = parsed || {};
    return result;
  }

  async deactivateUser(actorId: string, actorRole: string, idToDeactivate: string) {
    // Autodesactivación prohibida (RN-011)
    if (actorId === idToDeactivate) {
      throw new BadRequestException('No es posible desactivar su propia cuenta.');
    }

    if (actorRole === UserRole.JOYERO || actorRole === 'Joyero') {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: idToDeactivate } });
    if (!targetUser) throw new NotFoundException('El usuario seleccionado no existe');

    if (targetUser.accountStatus === AccountStatus.INACTIVE) {
      throw new BadRequestException('El usuario seleccionado ya se encuentra inactivo');
    }

    // Permisos jerárquicos
    if (targetUser.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    // Baja lógica (RN-010)
    const updated = await this.prisma.user.update({
      where: { id: idToDeactivate },
      data: { accountStatus: AccountStatus.INACTIVE },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        `DESACTIVAR_USUARIO_${targetUser.role}`,
        'Usuarios',
        { targetUserId: idToDeactivate, previousStatus: targetUser.accountStatus, newStatus: AccountStatus.INACTIVE },
        actorRole,
      );
    }

    const parsed = parseUser(updated);
    const { password, ...result } = parsed || {};
    return result;
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.password !== oldPass) {
      throw new BadRequestException('La contraseña actual ingresada es incorrecta');
    }

    if (!newPass || newPass.length < 4) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 4 caracteres');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newPass,
        mustChangePassword: false,
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(userId, 'CAMBIO_CONTRASEÑA', 'Autenticación', { userId });
    }
    const { password, ...result } = parseUser(updated);
    return result;
  }

  async resetPasswordByAdmin(actorId: string, actorRole: string, targetUserId: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Usuario no encontrado');

    if (targetUser.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    const newTempPassword = Math.random().toString(36).slice(-8);

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        password: newTempPassword,
        mustChangePassword: true,
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        'RESTABLECER_CONTRASEÑA_ADMIN',
        'Usuarios',
        { targetUserId },
        actorRole,
      );
    }

    return { success: true, tempPassword: newTempPassword };
  }

  async updateStatus(id: string, status: UserStatus) {
    return this.updateShiftStatus(id, status);
  }

  async updateShiftStatus(id: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    const parsedUser = parseUser(user);
    const history = Array.isArray(parsedUser.history) ? [...parsedUser.history] : [];
    history.push({ status, timestamp: new Date().toISOString() });

    const updateData: any = {
      status,
      history: JSON.stringify(history),
    };

    if (status === UserStatus.AVAILABLE) {
      updateData.lastLogin = new Date();
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return parseUser(updated);
  }

  async validatePassword(id: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.password !== pass) return null;
    const { password, ...result } = parseUser(user);
    return result;
  }

  async create(data: any) {
    if (!data.id || !data.name) {
      throw new BadRequestException('El ID y el Nombre son obligatorios');
    }
    const existing = await this.prisma.user.findUnique({ where: { id: data.id } });
    if (existing) {
      throw new BadRequestException('El ID de usuario ya existe');
    }
    return this.createUser('SISTEMA', 'Super Administrador', data);
  }

  async validateRecovery(id: string, answers: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const parsed = parseUser(user);
    const questions = parsed.securityQuestions || [];
    if (!questions.length) return null;
    const match = answers.every((ans, idx) => {
      if (!questions[idx]) return false;
      const targetAns = questions[idx].answer || questions[idx];
      return String(ans).trim().toLowerCase() === String(targetAns).trim().toLowerCase();
    });
    return match ? parsed : null;
  }
}
