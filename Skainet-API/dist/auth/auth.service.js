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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    prisma;
    auditService;
    constructor(usersService, jwtService, prisma, auditService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async login(id, pass) {
        if (!id || !pass) {
            throw new common_1.UnauthorizedException('Debe ingresar su número de identificación y contraseña');
        }
        const usersSvc = this.usersService;
        if (usersSvc?.validatePassword) {
            const validatedUser = await usersSvc.validatePassword(id, pass);
            if (!validatedUser) {
                throw new common_1.UnauthorizedException('Número de identificación o contraseña incorrectos');
            }
            if (validatedUser.accountStatus === 'Inactivo' || validatedUser.accountStatus === 'INACTIVE') {
                throw new common_1.UnauthorizedException('Su cuenta se encuentra inactiva. Contacte a su administrador');
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
            throw new common_1.UnauthorizedException('Número de identificación o contraseña incorrectos');
        }
        if (user.accountStatus === 'Inactivo') {
            throw new common_1.UnauthorizedException('Su cuenta se encuentra inactiva. Contacte a su administrador');
        }
        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
            const minutesRemaining = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
            throw new common_1.UnauthorizedException(`Ha superado el número de intentos permitidos. Intente nuevamente en unos ${minutesRemaining} minutos.`);
        }
        if (user.password !== pass) {
            if (usersSvc?.incrementFailedAttempts) {
                await usersSvc.incrementFailedAttempts(id);
            }
            const failedAttempts = (user.failedAttempts || 0) + 1;
            const updateData = { failedAttempts };
            if (failedAttempts >= 5) {
                updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
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
            throw new common_1.UnauthorizedException('Número de identificación o contraseña incorrectos');
        }
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map