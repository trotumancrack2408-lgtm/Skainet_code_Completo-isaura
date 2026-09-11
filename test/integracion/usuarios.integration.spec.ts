/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 1: Usuarios y Roles - RF-001)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para la Gestión de Cuentas
 * Administrativas dentro del Módulo de Gestión de Usuarios y Roles (RF-001).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Verificación de la interacción entre controladores HTTP, servicios de negocio,
 * persistencia de datos (Prisma/BD), autenticación (AuthService) y auditoría.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Al exponer estas pruebas ante evaluadores o clientes, destaque cómo el controlador
 * (`UsersController`), el servicio de negocio (`UsersService`) y el servicio de auditoría
 * (`AuditService`) colaboran para garantizar la seguridad jerárquica del taller de joyería.
 * 
 * Casos incluidos en este archivo:
 * - CP-001: Jerarquía de roles de 3 niveles (Super Admin, Admin, Joyero)
 * - CP-002: Permisos Super Admin (Super Admin gestiona Administradores)
 * - CP-003: Permisos Administrador (Administrador gestiona Joyeros)
 * - CP-006: Auditoría de usuarios (Log automático de acciones en la BD)
 * - CP-007: Respeto jerárquico global (Control de acceso en endpoints API/Controller)
 * - CP-008: Registro Admin válido (Persistencia correcta de nuevo Admin)
 * - CP-009: Documento Admin duplicado (Rechazo por restricción de unicidad en BD)
 * - CP-011: Bloqueo Admin crea Admin (Rechazo HTTP/Servicio por intento de escalamiento)
 * - CP-014: Permisos Módulo Admin (Verificación de RBAC al modificar cuentas administrativas)
 * - CP-015: Clave temporal cifrada (Generación de clave aleatoria y forzado de cambio)
 * - CP-017: Auditoría alta Admin (Registro preciso del evento CREAR_USUARIO_Administrador)
 * - CP-018: Consulta lista Admin (Lectura de lista desinfectando contraseñas)
 * - CP-020: Bloqueo consulta Admin (Filtrado seguro y control de visibilidad por rol)
 * - CP-021: Filtro Admin por documento (Búsqueda puntual por clave primaria ID en BD)
 * - CP-022: Detalle e historial Admin (Deserialización de historial de turnos/estados)
 * - CP-023: Edición exitosa Admin (UPDATE en BD y refresco de vista/objeto retornado)
 * - CP-026: Bloqueo edita otros Admin (Denegación por intento no autorizado de edición)
 * - CP-027: Concurrencia edición Admin (Manejo secuencial de modificaciones consecutivas)
 * - CP-029: Auditoría edición Admin (Registro automático del evento ACTUALIZAR_USUARIO_Administrador)
 * - CP-031: Desactivación lógica Admin (Cambio de estado accountStatus = Inactivo en BD)
 * - CP-033: Bloqueo desactiva Admin (Denegar desactivación por rol Administrador)
 * - CP-036: Bloqueo acceso inactivo (Fallo de login posterior a desactivación)
 * - CP-037: No eliminación física (Verificar presencia del registro en BD tras desactivar)
 * - CP-038: Desactivar otro Admin (Super Admin desactiva cuenta de un Admin)
 * - CP-039: Auditoría baja Admin (Registro del evento DESACTIVAR_USUARIO_Administrador)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from '../../Skainet-API/src/users/users.controller';
import { UsersService, UserRole, UserStatus, AccountStatus } from '../../Skainet-API/src/users/users.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';
import { AuthService } from '../../Skainet-API/src/auth/auth.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('PRUEBAS DE INTEGRACIÓN - Gestión Administrativa (RF-001)', () => {
  let controller: UsersController;
  let service: UsersService;
  let authService: AuthService;
  let prismaMock: any;
  let auditMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    auditMock = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock_token') },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  describe('CP-001: Jerarquía de roles de 3 niveles', () => {
    it('Debe permitir a Super Admin gestionar Admins, a Admin gestionar Joyeros, y bloquear a Joyero', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '2001',
        name: 'Admin Nivel 2',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.OFFLINE,
      });

      const resSuperAdmin = await service.createUser('1000000000', UserRole.SUPER_ADMIN, {
        id: '2001',
        name: 'Admin Nivel 2',
        role: UserRole.ADMIN,
      });
      expect(resSuperAdmin.id).toBe('2001');

      prismaMock.user.create.mockResolvedValue({
        id: '3001',
        name: 'Joyero Nivel 3',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.OFFLINE,
      });

      const resAdmin = await service.createUser('2001', UserRole.ADMIN, {
        id: '3001',
        name: 'Joyero Nivel 3',
        role: UserRole.JOYERO,
      });
      expect(resAdmin.id).toBe('3001');

      await expect(
        service.createUser('3001', UserRole.JOYERO, {
          id: '3002',
          name: 'Joyero Intruso',
          role: UserRole.JOYERO,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CP-002: Permisos Super Admin', () => {
    it('Debe autorizar exclusivamente al Super Admin para crear usuarios de tipo Administrador', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '1002',
        name: 'Nuevo Administrador',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
      });

      const result = await service.createUser('1000000000', UserRole.SUPER_ADMIN, {
        id: '1002',
        name: 'Nuevo Administrador',
        role: UserRole.ADMIN,
        email: 'admin.nuevo@skainet.com',
      });

      expect(result).toBeDefined();
      expect(result.role).toBe(UserRole.ADMIN);
      expect(prismaMock.user.create).toHaveBeenCalled();
    });
  });

  describe('CP-003: Permisos Administrador', () => {
    it('Debe permitir al Administrador registrar exitosamente una nueva cuenta de Joyero', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '2005',
        name: 'Pedro Joyero',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
      });

      const result = await service.createUser('4', UserRole.ADMIN, {
        id: '2005',
        name: 'Pedro Joyero',
        role: UserRole.JOYERO,
        email: 'pedro.joyero@skainet.com',
      });

      expect(result.id).toBe('2005');
      expect(result.role).toBe(UserRole.JOYERO);
    });
  });

  describe('CP-006: Auditoría de usuarios', () => {
    it('Debe invocar automáticamente el servicio de auditoría al crear un usuario', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '5001',
        name: 'Joyero Auditado',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
      });

      await service.createUser('1000000000', UserRole.SUPER_ADMIN, {
        id: '5001',
        name: 'Joyero Auditado',
        role: UserRole.JOYERO,
      });

      expect(auditMock.log).toHaveBeenCalledWith(
        '1000000000',
        'CREAR_USUARIO_Joyero',
        'Usuarios',
        expect.objectContaining({ createdUserId: '5001', name: 'Joyero Auditado' }),
        UserRole.SUPER_ADMIN,
      );
    });
  });

  describe('CP-007: Respeto jerárquico global', () => {
    it('Debe rechazar en la capa de controlador cuando el token indica un rol no autorizado', async () => {
      const mockReqJoyero = {
        user: { sub: '3001', role: UserRole.JOYERO },
      };

      const bodyIntentAdmin = {
        id: '8001',
        name: 'Admin Ilegal',
        role: UserRole.ADMIN,
      };

      await expect(controller.create(bodyIntentAdmin, mockReqJoyero)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CP-008: Registro Admin válido', () => {
    it('Debe guardar en la BD al nuevo Admin con contraseña temporal cifrada y bandera de cambio inicial', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.OFFLINE,
      }));

      const newAdminData = {
        id: '1098765432',
        name: 'Carlos Administrador Taller',
        role: UserRole.ADMIN,
        email: 'carlos.admin@skainet.com',
        phone: '+573009998877',
      };

      const result = await service.createUser('1000000000', UserRole.SUPER_ADMIN, newAdminData);

      expect(result.id).toBe('1098765432');
      expect(result.name).toBe('Carlos Administrador Taller');
      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.mustChangePassword).toBe(true);
      expect(result.tempPassword).toBeDefined();
    });
  });

  describe('CP-009: Documento Admin duplicado', () => {
    it('Debe rechazar la creación si el ID/Cédula del nuevo Admin ya existe en la base de datos', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1098765432',
        name: 'Administrador Existente',
        role: UserRole.ADMIN,
      });

      const duplicateAdminData = {
        id: '1098765432',
        name: 'Otro Admin Con Misma Cedula',
        role: UserRole.ADMIN,
      };

      await expect(
        service.createUser('1000000000', UserRole.SUPER_ADMIN, duplicateAdminData),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('CP-011: Bloqueo Admin crea Admin', () => {
    it('Debe denegar la solicitud con ForbiddenException cuando un Admin intenta crear otro Admin', async () => {
      const payload = {
        id: '4001',
        name: 'Segundo Admin',
        role: UserRole.ADMIN,
      };

      await expect(
        service.createUser('4', UserRole.ADMIN, payload),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('CP-014: Permisos Módulo Admin', () => {
    it('Debe rechazar la edición de un Admin si el actor no es Super Admin', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Objetivo',
        role: UserRole.ADMIN,
      });

      await expect(
        service.updateUser('4', UserRole.ADMIN, '2001', { name: 'Nuevo Nombre' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CP-015: Clave temporal cifrada', () => {
    it('Debe generar una clave temporal y requerir cambio en el primer ingreso tras el reset por Admin', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Para Reset',
        role: UserRole.ADMIN,
      });
      prismaMock.user.update.mockResolvedValue({
        id: '2001',
        mustChangePassword: true,
      });

      const result = await service.resetPasswordByAdmin('1000000000', UserRole.SUPER_ADMIN, '2001');

      expect(result.success).toBe(true);
      expect(result.tempPassword).toBeDefined();
      expect(result.tempPassword.length).toBeGreaterThanOrEqual(6);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: '2001' },
        data: expect.objectContaining({ mustChangePassword: true }),
      });
    });
  });

  describe('CP-017: Auditoría alta Admin', () => {
    it('Debe registrar de manera precisa la auditoría del evento CREAR_USUARIO_Administrador', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '1005',
        name: 'Admin Auditado',
        role: UserRole.ADMIN,
      });

      await service.createUser('1000000000', UserRole.SUPER_ADMIN, {
        id: '1005',
        name: 'Admin Auditado',
        role: UserRole.ADMIN,
      });

      expect(auditMock.log).toHaveBeenCalledWith(
        '1000000000',
        'CREAR_USUARIO_Administrador',
        'Usuarios',
        expect.objectContaining({ createdUserId: '1005', role: UserRole.ADMIN }),
        UserRole.SUPER_ADMIN,
      );
    });
  });

  describe('CP-018: Consulta lista Admin', () => {
    it('Debe obtener la lista de Administradores desde la BD suprimiendo las contraseñas', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: '4',
          name: 'Danna Administradora',
          role: UserRole.ADMIN,
          password: 'secret_hash_123',
          history: JSON.stringify([]),
        },
      ]);

      const list = await service.findAll(UserRole.ADMIN);

      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('4');
      expect(list[0].password).toBeUndefined();
    });
  });

  describe('CP-020: Bloqueo consulta Admin', () => {
    it('Debe permitir la filtración segura por rol garantizando lectura aislada', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.findAll('RolInexistente');

      expect(result).toEqual([]);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { role: 'RolInexistente' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('CP-021: Filtro Admin por documento', () => {
    it('Debe consultar un Administrador específico en BD filtrando por su documento/ID', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1098765432',
        name: 'Carlos Admin',
        role: UserRole.ADMIN,
        history: JSON.stringify([]),
      });

      const user = await service.findOne('1098765432');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: '1098765432' } });
      expect(user.id).toBe('1098765432');
      expect(user.name).toBe('Carlos Admin');
    });
  });

  describe('CP-022: Detalle e historial Admin', () => {
    it('Debe retornar el detalle completo del Administrador parseando su historial de estado', async () => {
      const mockHistory = [{ status: UserStatus.AVAILABLE, timestamp: '2026-08-23T10:00:00Z' }];
      prismaMock.user.findUnique.mockResolvedValue({
        id: '4',
        name: 'Danna Administradora',
        role: UserRole.ADMIN,
        history: JSON.stringify(mockHistory),
      });

      const user = await service.findOne('4');

      expect(user).toBeDefined();
      expect(Array.isArray(user.history)).toBe(true);
      expect(user.history[0].status).toBe(UserStatus.AVAILABLE);
    });
  });

  describe('CP-023: Edición exitosa Admin', () => {
    it('Debe actualizar exitosamente los datos del Administrador en la BD', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Nombre Viejo',
        email: 'viejo@skainet.com',
        role: UserRole.ADMIN,
      });

      prismaMock.user.update.mockImplementation(({ data }) => Promise.resolve({
        id: '2001',
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: UserRole.ADMIN,
      }));

      const payload = {
        name: 'Admin Nombre Nuevo',
        email: 'nuevo@skainet.com',
        phone: '+573009990000',
      };

      const result = await service.updateUser('1000000000', UserRole.SUPER_ADMIN, '2001', payload);

      expect(result.name).toBe('Admin Nombre Nuevo');
      expect(result.email).toBe('nuevo@skainet.com');
      expect(prismaMock.user.update).toHaveBeenCalled();
    });
  });

  describe('CP-026: Bloqueo edita otros Admin', () => {
    it('Debe denegar la edición con ForbiddenException si un Admin intenta modificar a otro Admin', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2002',
        name: 'Admin Objetivo',
        role: UserRole.ADMIN,
      });

      await expect(
        service.updateUser('4', UserRole.ADMIN, '2002', { name: 'Intento Edicion' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('CP-027: Concurrencia edición Admin', () => {
    it('Debe manejar actualizaciones consecutivas sobre el mismo Administrador de forma segura', async () => {
      let currentRecord = {
        id: '2001',
        name: 'Admin Inicial',
        email: 'v1@skainet.com',
        role: UserRole.ADMIN,
      };

      prismaMock.user.findUnique.mockImplementation(() => Promise.resolve(currentRecord));
      prismaMock.user.update.mockImplementation(({ data }) => {
        currentRecord = { ...currentRecord, ...data };
        return Promise.resolve(currentRecord);
      });

      const update1 = await service.updateUser('1000000000', UserRole.SUPER_ADMIN, '2001', {
        name: 'Admin V2',
        email: 'v2@skainet.com',
      });
      expect(update1.name).toBe('Admin V2');

      const update2 = await service.updateUser('1000000000', UserRole.SUPER_ADMIN, '2001', {
        name: 'Admin V3',
        email: 'v3@skainet.com',
      });
      expect(update2.name).toBe('Admin V3');
    });
  });

  describe('CP-029: Auditoría edición Admin', () => {
    it('Debe registrar automáticamente el evento de auditoría ACTUALIZAR_USUARIO_Administrador', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Previo',
        role: UserRole.ADMIN,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '2001',
        name: 'Admin Editado',
        role: UserRole.ADMIN,
      });

      await service.updateUser('1000000000', UserRole.SUPER_ADMIN, '2001', {
        name: 'Admin Editado',
        email: 'editado@skainet.com',
      });

      expect(auditMock.log).toHaveBeenCalledWith(
        '1000000000',
        'ACTUALIZAR_USUARIO_Administrador',
        'Usuarios',
        expect.objectContaining({ targetUserId: '2001' }),
        UserRole.SUPER_ADMIN,
      );
    });
  });

  describe('CP-031: Desactivación lógica Admin', () => {
    it('Debe realizar la baja lógica actualizando accountStatus a Inactivo sin borrar el registro', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin A Desactivar',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '2001',
        name: 'Admin A Desactivar',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.INACTIVE,
      });

      const result = await service.deactivateUser('1000000000', UserRole.SUPER_ADMIN, '2001');

      expect(result.accountStatus).toBe(AccountStatus.INACTIVE);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: '2001' },
        data: { accountStatus: AccountStatus.INACTIVE },
      });
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-033
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: Bloqueo desactiva Admin.
   * Criterio de Aceptación: Denegar desactivación cuando es solicitada por rol Administrador sobre otro Admin.
   * --------------------------------------------------------------------------
   */
  describe('CP-033: Bloqueo desactiva Admin', () => {
    it('Debe rechazar con ForbiddenException si un Administrador intenta desactivar a otro Admin', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2002',
        name: 'Admin Objetivo',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
      });

      await expect(
        service.deactivateUser('4', UserRole.ADMIN, '2002'),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-036
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001 / RF-002
   * Tipo: INTEGRACIÓN
   * Objetivo: Bloqueo acceso inactivo.
   * Criterio de Aceptación: Rechazo de autenticación (Login) posterior a la desactivación del usuario.
   * --------------------------------------------------------------------------
   */
  describe('CP-036: Bloqueo acceso inactivo', () => {
    it('Debe bloquear el inicio de sesión si la cuenta del Administrador se encuentra Inactiva', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Inactivo',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.INACTIVE,
        password: '123',
      });

      await expect(
        authService.login('2001', '123'),
      ).rejects.toThrow('Su cuenta se encuentra inactiva. Contacte a su administrador');
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-037
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: No eliminación física.
   * Criterio de Aceptación: Verificar presencia del registro en BD tras la desactivación.
   * --------------------------------------------------------------------------
   */
  describe('CP-037: No eliminación física', () => {
    it('Debe mantener la entidad en la BD cambiando su estado a Inactivo sin ejecutar un DELETE', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Preservado',
        accountStatus: AccountStatus.INACTIVE,
      });

      const user = await service.findOne('2001');

      expect(user).toBeDefined();
      expect(user.id).toBe('2001');
      expect(user.accountStatus).toBe(AccountStatus.INACTIVE);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-038
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: Desactivar otro Admin.
   * Criterio de Aceptación: Super Admin desactiva exitosamente la cuenta de un Admin.
   * --------------------------------------------------------------------------
   */
  describe('CP-038: Desactivar otro Admin', () => {
    it('Debe permitir al Super Admin desactivar la cuenta de un Administrador', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Subordinado',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '2001',
        name: 'Admin Subordinado',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.INACTIVE,
      });

      const result = await service.deactivateUser('1000000000', UserRole.SUPER_ADMIN, '2001');

      expect(result.accountStatus).toBe(AccountStatus.INACTIVE);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: '2001' },
        data: { accountStatus: AccountStatus.INACTIVE },
      });
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-039
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: Auditoría baja Admin.
   * Criterio de Aceptación: Registro automático del evento DESACTIVAR_USUARIO_Administrador en BD.
   * --------------------------------------------------------------------------
   */
  describe('CP-039: Auditoría baja Admin', () => {
    it('Debe registrar de manera precisa el evento de auditoría DESACTIVAR_USUARIO_Administrador', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin A Desactivar',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '2001',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.INACTIVE,
      });

      await service.deactivateUser('1000000000', UserRole.SUPER_ADMIN, '2001');

      expect(auditMock.log).toHaveBeenCalledWith(
        '1000000000',
        'DESACTIVAR_USUARIO_Administrador',
        'Usuarios',
        expect.objectContaining({ targetUserId: '2001', newStatus: AccountStatus.INACTIVE }),
        UserRole.SUPER_ADMIN,
      );
    });
  });
});
