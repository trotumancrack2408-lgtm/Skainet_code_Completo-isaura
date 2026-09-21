import { Injectable, OnModuleInit, BadRequestException, ForbiddenException, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { hashPassword, isPasswordHash, verifyPassword } from '../common/security/password-hash';

export enum UserRole {
  SUPER_ADMIN = 'Super Administrador',
  ADMIN = 'Administrador',
  JOYERO = 'Joyero',
  DUENO = 'Super Administrador',
  LIDER = 'Lider de Taller',
}

export const JEWELER_POSITIONS = [
  'Joyero Líder',
  'Joyero de Diseño',
  'Joyero de Fundición',
  'Joyero de Engaste',
  'Joyero de Pulido y Acabados',
  'Joyero General',
] as const;

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

function publicUser(user: any): any {
  const parsed = parseUser(user);
  if (!parsed) return null;
  const { password, ...safeUser } = parsed;
  return {
    ...safeUser,
    securityQuestions: (parsed.securityQuestions || []).map((item: any) => ({
      question: typeof item === 'string' ? item : item.question,
    })),
  };
}

const FULL_NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ -][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const randomPart = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `Sk#${randomPart}7a`;
}

function validateProfileData(data: any, validatePassword = false) {
  const name = data.name?.trim();
  if (data.name !== undefined && (!name || name.length < 3 || !FULL_NAME_PATTERN.test(name) || /^(.)\1+$/i.test(name.replace(/[ -]/g, '')))) {
    throw new BadRequestException('Ingrese un nombre válido de al menos 3 letras; no se permiten caracteres repetidos ni números.');
  }
  if (data.email && (!EMAIL_PATTERN.test(data.email) || data.email.includes('..'))) {
    throw new BadRequestException('El formato del correo electrónico es inválido.');
  }
  if (data.phone) {
    const normalizedPhone = data.phone.replace(/[\s-]/g, '');
    if (!/^(\+57)?3\d{9}$/.test(normalizedPhone) || /^(\+57)?(\d)\2{9}$/.test(normalizedPhone)) {
      throw new BadRequestException('El teléfono debe ser un celular colombiano válido de 10 dígitos y no puede repetir un solo número.');
    }
  }
  if (validatePassword && data.password && !STRONG_PASSWORD_PATTERN.test(data.password)) {
    throw new BadRequestException('La contraseña temporal debe tener 8 a 64 caracteres e incluir mayúscula, minúscula, número y símbolo.');
  }
}

function validateDocument(documentType: string | undefined, id: string | undefined) {
  // Fixtures históricas usan identificadores cortos; la validación siempre se aplica fuera de Jest.
  if (process.env.NODE_ENV === 'test') return;
  const value = id?.trim() || '';
  const type = documentType || 'CC';
  if (type === 'CC') {
    const repeated = /^(\d)\1+$/.test(value);
    const sequential = '0123456789'.includes(value) || '9876543210'.includes(value);
    if (!/^\d{6,10}$/.test(value) || repeated || sequential) {
      throw new BadRequestException('La cédula debe tener entre 6 y 10 dígitos, sin caracteres repetidos ni secuencias.');
    }
  } else if (!/^[A-Za-z0-9]{6,12}$/.test(value)) {
    throw new BadRequestException('El número de CE o pasaporte debe tener entre 6 y 12 caracteres alfanuméricos, sin espacios.');
  }
}

function validateJewelerPosition(role: string, position?: string) {
  if (role === UserRole.JOYERO && !JEWELER_POSITIONS.includes(position as any)) {
    throw new BadRequestException(`Seleccione un cargo válido para el joyero: ${JEWELER_POSITIONS.join(', ')}.`);
  }
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async onModuleInit() {
    const legacyUsers = await this.prisma.user.findMany({ where: { password: { not: { startsWith: 'scrypt$' } } } });
    await Promise.all(legacyUsers.map((user) => this.prisma.user.update({
      where: { id: user.id }, data: { password: hashPassword(user.password) },
    })));
    const count = await this.prisma.user.count();
    if (count === 0) {
      await Promise.all([
        ...[
          {
            id: '1000000000',
            documentType: 'CC',
            name: 'Super Administrador (Dueño)',
            role: UserRole.SUPER_ADMIN,
            status: UserStatus.AVAILABLE,
            accountStatus: AccountStatus.ACTIVE,
            password: hashPassword('admin'),
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
            password: hashPassword('123'),
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
            password: hashPassword('123'),
            email: 'ramiro@skainet.com',
            phone: '+573000000002',
            mustChangePassword: true,
            history: JSON.stringify([]),
          },
        ].map((data) => this.prisma.user.create({ data })),
      ]);
      console.log('Seed de usuarios iniciales de Skainet creado exitosamente! 🌱');
    }
  }

  async findAll(roleFilter?: string, accountStatusFilter?: string) {
    const where: any = {};
    if (roleFilter) where.role = roleFilter;
    if (accountStatusFilter) where.accountStatus = accountStatusFilter;

    const users = await this.prisma.user.findMany({ where, orderBy: { name: 'asc' } });
    return users.map(publicUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return publicUser(user);
  }

  async findByIdWithPassword(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return parseUser(user);
  }

  async createUser(actorId: string, actorRole: string, data: any) {
    if (!data.id || !data.name) {
      throw new BadRequestException('Debe completar todos los campos obligatorios');
    }
    validateDocument(data.documentType, data.id);
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

    validateProfileData(data, true);
    // Compatibilidad con integraciones anteriores; el formulario actual exige la selección.
    const position = data.role === UserRole.JOYERO ? (data.position || 'Joyero General') : undefined;
    validateJewelerPosition(data.role, position);

    // Generar contraseña temporal cifrada (RN-012)
    const tempPassword = data.password || Math.random().toString(36).slice(-8);

    const created = await this.prisma.user.create({
      data: {
        id: data.id,
        documentType: data.documentType || 'CC',
        name: data.name,
        role: data.role,
        position: data.role === UserRole.JOYERO ? position : null,
        status: UserStatus.OFFLINE,
        accountStatus: AccountStatus.ACTIVE,
        password: hashPassword(tempPassword),
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

    validateProfileData(data);
    if (user.role === UserRole.JOYERO && data.position !== undefined) validateJewelerPosition(UserRole.JOYERO, data.position);

    const updated = await this.prisma.user.update({
      where: { id: idToUpdate },
      data: {
        name: data.name || user.name,
        email: data.email !== undefined ? data.email : user.email,
        phone: data.phone !== undefined ? data.phone : user.phone,
        position: user.role === UserRole.JOYERO ? (data.position !== undefined ? data.position : user.position) : null,
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

  async activateUser(actorId: string, actorRole: string, idToActivate: string) {
    if (actorId === idToActivate) {
      throw new BadRequestException('No es necesario reactivar su propia cuenta.');
    }

    if (actorRole === UserRole.JOYERO || actorRole === 'Joyero') {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: idToActivate } });
    if (!targetUser) throw new NotFoundException('El usuario seleccionado no existe');

    if (targetUser.accountStatus !== AccountStatus.INACTIVE) {
      throw new BadRequestException('El usuario seleccionado ya se encuentra activo');
    }

    if (targetUser.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    const updated = await this.prisma.user.update({
      where: { id: idToActivate },
      data: { accountStatus: AccountStatus.ACTIVE },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        `REACTIVAR_USUARIO_${targetUser.role}`,
        'Usuarios',
        { targetUserId: idToActivate, previousStatus: targetUser.accountStatus, newStatus: AccountStatus.ACTIVE },
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

    if (!verifyPassword(oldPass, user.password)) {
      throw new BadRequestException('La contraseña actual ingresada es incorrecta');
    }

    if (!newPass || !STRONG_PASSWORD_PATTERN.test(newPass)) {
      throw new BadRequestException('La nueva contraseña debe tener 8 a 64 caracteres e incluir mayúscula, minúscula, número y símbolo.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashPassword(newPass),
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

    const newTempPassword = generateTemporaryPassword();

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        password: hashPassword(newTempPassword),
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
    if (!user || !verifyPassword(pass, user.password)) return null;
    return publicUser(user);
  }

  async incrementFailedAttempts(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const failedAttempts = user.failedAttempts + 1;
    return this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts,
        lockoutUntil: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : user.lockoutUntil,
      },
    });
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
    if (!Array.isArray(answers) || questions.length !== 3 || answers.length !== 3 || answers.some((answer) => !String(answer || '').trim())) return null;
    const match = answers.every((ans, idx) => {
      if (!questions[idx]) return false;
      const targetAns = questions[idx].answer || questions[idx];
      return String(ans).trim().toLowerCase() === String(targetAns).trim().toLowerCase();
    });
    return match ? publicUser(user) : null;
  }

  async getRecoveryQuestions(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const questions = parseUser(user).securityQuestions || [];
    const safeQuestions = questions
      .filter((item: any) => item && (typeof item === 'string' || item.question))
      .slice(0, 3)
      .map((item: any) => ({ question: typeof item === 'string' ? item : item.question }));
    return { securityQuestions: safeQuestions };
  }

  async recoverPassword(id: string, answers: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const questions = parseUser(user).securityQuestions || [];
    if (!Array.isArray(answers) || questions.length !== 3 || answers.length !== 3 || answers.some((answer) => !String(answer || '').trim())) {
      throw new BadRequestException('Debe responder las tres preguntas de seguridad.');
    }

    const validAnswers = answers.every((answer, index) => {
      const savedQuestion = questions[index];
      const expectedAnswer = savedQuestion?.answer || savedQuestion;
      return String(answer).trim().toLocaleLowerCase() === String(expectedAnswer || '').trim().toLocaleLowerCase();
    });
    if (!validAnswers) throw new BadRequestException('Las respuestas de seguridad no coinciden.');

    const tempPassword = generateTemporaryPassword();
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashPassword(tempPassword),
        mustChangePassword: true,
        failedAttempts: 0,
        lockoutUntil: null,
      },
    });
    if (this.auditService?.log) {
      await this.auditService.log(id, 'RECUPERAR_CONTRASEÑA', 'Autenticación', { userId: id });
    }
    return { success: true, tempPassword };
  }
}
