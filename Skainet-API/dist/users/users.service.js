"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = exports.AccountStatus = exports.UserStatus = exports.UserRole = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "Super Administrador";
    UserRole["ADMIN"] = "Administrador";
    UserRole["JOYERO"] = "Joyero";
    UserRole["DUENO"] = "Super Administrador";
    UserRole["LIDER"] = "Lider de Taller";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["OFFLINE"] = "Fuera de Turno";
    UserStatus["AVAILABLE"] = "Disponible";
    UserStatus["WORKING"] = "En Proceso";
    UserStatus["PAUSED"] = "En Pausa";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "Activo";
    AccountStatus["INACTIVE"] = "Inactivo";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
function parseUser(user) {
    if (!user)
        return null;
    return {
        ...user,
        history: typeof user.history === 'string' ? JSON.parse(user.history) : (user.history || []),
        securityQuestions: typeof user.securityQuestions === 'string' ? JSON.parse(user.securityQuestions) : (user.securityQuestions || []),
    };
}
let UsersService = class UsersService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
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
    async findAll(roleFilter, accountStatusFilter) {
        const where = {};
        if (roleFilter)
            where.role = roleFilter;
        if (accountStatusFilter)
            where.accountStatus = accountStatusFilter;
        const users = await this.prisma.user.findMany({ where, orderBy: { name: 'asc' } });
        return users.map(({ password, ...user }) => parseUser(user));
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            return null;
        return parseUser(user);
    }
    async findByIdWithPassword(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return parseUser(user);
    }
    async createUser(actorId, actorRole, data) {
        if (!data.id || !data.name) {
            throw new common_1.BadRequestException('Debe completar todos los campos obligatorios');
        }
        if (data.email && (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email) || data.email.includes('..'))) {
            throw new common_1.BadRequestException('El formato del correo electrónico es inválido');
        }
        if (data.role === UserRole.ADMIN) {
            if (actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
                throw new common_1.ForbiddenException('No tiene permisos para realizar esta acción');
            }
        }
        else if (data.role === UserRole.JOYERO) {
            if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
                throw new common_1.ForbiddenException('No tiene permisos para realizar esta acción');
            }
        }
        else if (data.role === UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('No se permite crear cuentas adicionales de Super Administrador');
        }
        const existing = await this.prisma.user.findUnique({ where: { id: data.id } });
        if (existing) {
            throw new common_1.BadRequestException('El número de identificación ya se encuentra registrado en el sistema');
        }
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
                mustChangePassword: true,
            },
        });
        if (!created) {
            throw new common_1.BadRequestException('Error al crear usuario');
        }
        if (this.auditService?.log) {
            await this.auditService.log(actorId, `CREAR_USUARIO_${data.role}`, 'Usuarios', { createdUserId: created.id, name: created.name, role: created.role }, actorRole);
        }
        const parsed = parseUser(created);
        const { password, ...result } = parsed || {};
        return { ...result, tempPassword };
    }
    async updateUser(actorId, actorRole, idToUpdate, data) {
        if (actorRole === UserRole.JOYERO || actorRole === 'Joyero') {
            throw new common_1.ForbiddenException('Un Joyero no tiene permisos para modificar perfiles');
        }
        const user = await this.prisma.user.findUnique({ where: { id: idToUpdate } });
        if (!user)
            throw new common_1.NotFoundException('El usuario seleccionado no existe');
        if (user.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
            throw new common_1.ForbiddenException('No tiene permisos para realizar esta acción');
        }
        if (data.name !== undefined && (!data.name || !data.name.trim())) {
            throw new common_1.BadRequestException('Debe completar todos los campos obligatorios');
        }
        if (data.email && (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email) || data.email.includes('..'))) {
            throw new common_1.BadRequestException('El formato del correo electrónico es inválido');
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
            await this.auditService.log(actorId, `ACTUALIZAR_USUARIO_${user.role || 'Usuario'}`, 'Usuarios', { targetUserId: idToUpdate, changes: { name: data.name, email: data.email, phone: data.phone } }, actorRole);
        }
        const parsed = parseUser(updated);
        const { password, ...result } = parsed || {};
        return result;
    }
    async deactivateUser(actorId, actorRole, idToDeactivate) {
        if (actorId === idToDeactivate) {
            throw new common_1.BadRequestException('No es posible desactivar su propia cuenta.');
        }
        if (actorRole === UserRole.JOYERO || actorRole === 'Joyero') {
            throw new common_1.ForbiddenException('No tiene permisos para realizar esta acción');
        }
        const targetUser = await this.prisma.user.findUnique({ where: { id: idToDeactivate } });
        if (!targetUser)
            throw new common_1.NotFoundException('El usuario seleccionado no existe');
        if (targetUser.accountStatus === AccountStatus.INACTIVE) {
            throw new common_1.BadRequestException('El usuario seleccionado ya se encuentra inactivo');
        }
        if (targetUser.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
            throw new common_1.ForbiddenException('No tiene permisos para realizar esta acción');
        }
        const updated = await this.prisma.user.update({
            where: { id: idToDeactivate },
            data: { accountStatus: AccountStatus.INACTIVE },
        });
        if (this.auditService?.log) {
            await this.auditService.log(actorId, `DESACTIVAR_USUARIO_${targetUser.role}`, 'Usuarios', { targetUserId: idToDeactivate, previousStatus: targetUser.accountStatus, newStatus: AccountStatus.INACTIVE }, actorRole);
        }
        const parsed = parseUser(updated);
        const { password, ...result } = parsed || {};
        return result;
    }
    async changePassword(userId, oldPass, newPass) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        if (user.password !== oldPass) {
            throw new common_1.BadRequestException('La contraseña actual ingresada es incorrecta');
        }
        if (!newPass || newPass.length < 4) {
            throw new common_1.BadRequestException('La nueva contraseña debe tener al menos 4 caracteres');
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
    async resetPasswordByAdmin(actorId, actorRole, targetUserId) {
        const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser)
            throw new common_1.NotFoundException('Usuario no encontrado');
        if (targetUser.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN && actorRole !== 'Dueno') {
            throw new common_1.ForbiddenException('No tiene permisos para realizar esta acción');
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
            await this.auditService.log(actorId, 'RESTABLECER_CONTRASEÑA_ADMIN', 'Usuarios', { targetUserId }, actorRole);
        }
        return { success: true, tempPassword: newTempPassword };
    }
    async updateStatus(id, status) {
        return this.updateShiftStatus(id, status);
    }
    async updateShiftStatus(id, status) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            return null;
        const parsedUser = parseUser(user);
        const history = Array.isArray(parsedUser.history) ? [...parsedUser.history] : [];
        history.push({ status, timestamp: new Date().toISOString() });
        const updateData = {
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
    async validatePassword(id, pass) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user || user.password !== pass)
            return null;
        const { password, ...result } = parseUser(user);
        return result;
    }
    async create(data) {
        if (!data.id || !data.name) {
            throw new common_1.BadRequestException('El ID y el Nombre son obligatorios');
        }
        const existing = await this.prisma.user.findUnique({ where: { id: data.id } });
        if (existing) {
            throw new common_1.BadRequestException('El ID de usuario ya existe');
        }
        return this.createUser('SISTEMA', 'Super Administrador', data);
    }
    async validateRecovery(id, answers) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            return null;
        const parsed = parseUser(user);
        const questions = parsed.securityQuestions || [];
        if (!questions.length)
            return null;
        const match = answers.every((ans, idx) => {
            if (!questions[idx])
                return false;
            const targetAns = questions[idx].answer || questions[idx];
            return String(ans).trim().toLowerCase() === String(targetAns).trim().toLowerCase();
        });
        return match ? parsed : null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map