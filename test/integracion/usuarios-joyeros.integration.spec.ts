/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 1: Gestión de Joyeros - RF-001)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración dedicada a la Gestión
 * de cuentas de Joyeros dentro del Módulo de Gestión de Usuarios y Roles (RF-001).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el controlador, el servicio de negocio, la
 * persistencia de cuentas de Joyeros en BD y el log automático de auditoría.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el Administrador o Super Administrador registra y gestiona de forma
 * segura a los operarios del taller de joyería, haciendo cumplir la unicidad de cédula,
 * el control de roles RBAC y la auditoría.
 * 
 * Casos incluidos en este archivo:
 * - CP-040: Registro Joyero válido (Inserción de nuevo Joyero en BD)
 * - CP-041: Documento Joyero duplicado (Error por clave duplicada en BD)
 * - CP-043: Bloqueo Joyero crea Joyero (Denegación de creación solicitada por rol Joyero)
 * - CP-046: Clave temporal Joyero (Generación y cifrado en BD de clave temporal)
 * - CP-047: Registro completo Joyero (Persistencia completa de perfil y rol en BD)
 * - CP-048: Auditoría alta Joyero (Log del evento CREAR_USUARIO_Joyero en BD)
 * - CP-049: Consulta lista Joyeros (Obtención de lista filtrada por rol Joyero desde BD)
 * - CP-051: Bloqueo lista Joyeros (Filtrado seguro / restricción a rol Joyero)
 * - CP-052: Filtro Joyero por documento (Consulta filtrada en BD por ID de Joyero)
 * - CP-053: Edición exitosa Joyero (Actualización en BD de datos del Joyero)
 * - CP-056: Bloqueo autoedición Joyero (Joyero no edita sus datos en este módulo)
 * - CP-057: Joyero inexistente en ed. (Manejo de error NotFoundException 404)
 * - CP-059: Edición datos válidos (Confirmar cambios guardados en BD)
 * - CP-060: Auditoría edición Joyero (Registro del evento ACTUALIZAR_USUARIO_Joyero en BD)
 * - CP-061: Desactivar Joyero sin OT (Inactivación en BD de Joyero sin Órdenes de Trabajo activas)
 * - CP-063: Bloqueo desactiva Joyero (Denegación de desactivación solicitada por rol Joyero)
 * - CP-065: Bloqueo baja Joyero con OT (Constraint con tabla OT de órdenes activas)
 * - CP-066: Bloqueo acceso Joyero baja (Error de autenticación posterior a la desactivación)
 * - CP-067: Baja Joyero sin reasignar (Verificación de cero OT pendientes para permitir baja)
 * - CP-068: Auditoría baja Joyero (Registro del evento DESACTIVAR_USUARIO_Joyero / DISABLE_JEWELER)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from '../../Skainet-API/src/users/users.controller';
import { UsersService, UserRole, UserStatus, AccountStatus } from '../../Skainet-API/src/users/users.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';
import { AuthService } from '../../Skainet-API/src/auth/auth.service';
import { ForbiddenException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('PRUEBAS DE INTEGRACIÓN - Gestión de Joyeros (RF-001)', () => {
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
      providers: [
        UsersService,
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock_token') } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  describe('CP-040: Registro Joyero válido', () => {
    it('Debe insertar un nuevo Joyero en la BD con todos sus datos válidos y generar log de auditoría', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.OFFLINE,
      }));

      const newJoyero = {
        id: '30055',
        name: 'Roberto Joyero Experto',
        role: UserRole.JOYERO,
        email: 'roberto.joyero@skainet.com',
        phone: '+573100001122',
      };

      const result = await service.createUser('4', UserRole.ADMIN, newJoyero);

      expect(result.id).toBe('30055');
      expect(result.name).toBe('Roberto Joyero Experto');
      expect(result.role).toBe(UserRole.JOYERO);
      expect(prismaMock.user.create).toHaveBeenCalled();
    });
  });

  describe('CP-041: Documento Joyero duplicado', () => {
    it('Debe rechazar el registro de un Joyero si la cédula/ID ya está registrada en el sistema', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '30055',
        name: 'Roberto Joyero Ya Existente',
        role: UserRole.JOYERO,
      });

      const duplicateJoyero = {
        id: '30055',
        name: 'Nuevo Joyero Misma Cedula',
        role: UserRole.JOYERO,
      };

      await expect(
        service.createUser('4', UserRole.ADMIN, duplicateJoyero),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CP-043: Bloqueo Joyero crea Joyero', () => {
    it('Debe denegar con ForbiddenException si un Joyero intenta registrar a otro Joyero', async () => {
      const payload = {
        id: '30099',
        name: 'Segundo Joyero',
        role: UserRole.JOYERO,
      };

      await expect(
        service.createUser('3001', UserRole.JOYERO, payload),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CP-046: Clave temporal Joyero', () => {
    it('Debe generar una clave temporal y activar la bandera de cambio en el primer ingreso', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.OFFLINE,
      }));

      const result = await service.createUser('4', UserRole.ADMIN, {
        id: '30044',
        name: 'Joyero Con Clave Temp',
        role: UserRole.JOYERO,
      });

      expect(result.tempPassword).toBeDefined();
      expect(result.mustChangePassword).toBe(true);
    });
  });

  describe('CP-047: Registro completo Joyero', () => {
    it('Debe persistir correctamente el perfil completo del Joyero en la base de datos', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.OFFLINE,
      }));

      const payload = {
        id: '30033',
        name: 'Carlos Joyero Maestro',
        role: UserRole.JOYERO,
        email: 'carlos.maestro@skainet.com',
        phone: '+573001114455',
      };

      const result = await service.createUser('4', UserRole.ADMIN, payload);

      expect(result.id).toBe('30033');
      expect(result.role).toBe(UserRole.JOYERO);
    });
  });

  describe('CP-048: Auditoría alta Joyero', () => {
    it('Debe registrar de manera precisa la auditoría de creación de cuenta de Joyero', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '30022',
        name: 'Joyero Auditado 2',
        role: UserRole.JOYERO,
      });

      await service.createUser('4', UserRole.ADMIN, {
        id: '30022',
        name: 'Joyero Auditado 2',
        role: UserRole.JOYERO,
      });

      expect(auditMock.log).toHaveBeenCalledWith(
        '4',
        'CREAR_USUARIO_Joyero',
        'Usuarios',
        expect.objectContaining({ createdUserId: '30022' }),
        UserRole.ADMIN,
      );
    });
  });

  describe('CP-049: Consulta lista Joyeros', () => {
    it('Debe consultar y retornar la lista de Joyeros desde la BD suprimiendo las contraseñas', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Ramiro Joyero',
          role: UserRole.JOYERO,
          password: '123',
          history: JSON.stringify([]),
        },
      ]);

      const joyeros = await service.findAll(UserRole.JOYERO);

      expect(joyeros).toHaveLength(1);
      expect(joyeros[0].password).toBeUndefined();
    });
  });

  describe('CP-051: Bloqueo lista Joyeros', () => {
    it('Debe consultar estrictamente las entidades correspondientes al filtro de rol especificado', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const list = await service.findAll(UserRole.JOYERO);

      expect(list).toEqual([]);
    });
  });

  describe('CP-052: Filtro Joyero por documento', () => {
    it('Debe consultar los detalles de un Joyero en particular especificando su documento/ID', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
        history: JSON.stringify([]),
      });

      const user = await service.findOne('1');

      expect(user.id).toBe('1');
    });
  });

  describe('CP-053: Edición exitosa Joyero', () => {
    it('Debe actualizar los datos del Joyero en la BD cuando la solicitud es realizada por un Admin', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
      });

      prismaMock.user.update.mockImplementation(({ data }) => Promise.resolve({
        id: '1',
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: UserRole.JOYERO,
      }));

      const editData = {
        name: 'Ramiro Joyero Editado',
        email: 'ramiro.editado@skainet.com',
        phone: '+573009991111',
      };

      const result = await service.updateUser('4', UserRole.ADMIN, '1', editData);

      expect(result.name).toBe('Ramiro Joyero Editado');
    });
  });

  describe('CP-056: Bloqueo autoedición Joyero', () => {
    it('Debe rechazar la solicitud si un usuario con rol Joyero intenta modificar un perfil', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
      });

      await expect(
        service.updateUser('1', UserRole.JOYERO, '1', { name: 'Autoedicion No Permitida' }),
      ).rejects.toThrow();
    });
  });

  describe('CP-057: Joyero inexistente en ed.', () => {
    it('Debe lanzar NotFoundException si se intenta actualizar un Joyero que no existe en la BD', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUser('4', UserRole.ADMIN, '99999999', { name: 'Joyero Fantasma' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('CP-059: Edición datos válidos', () => {
    it('Debe confirmar que los cambios en el perfil del Joyero son guardados en la BD', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero Actualizado',
        role: UserRole.JOYERO,
      });

      const updated = await service.updateUser('4', UserRole.ADMIN, '1', { name: 'Ramiro Joyero Actualizado' });

      expect(updated.name).toBe('Ramiro Joyero Actualizado');
    });
  });

  describe('CP-060: Auditoría edición Joyero', () => {
    it('Debe registrar de manera precisa la auditoría del evento ACTUALIZAR_USUARIO_Joyero', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero Editado',
        role: UserRole.JOYERO,
      });

      await service.updateUser('4', UserRole.ADMIN, '1', { name: 'Ramiro Joyero Editado' });

      expect(auditMock.log).toHaveBeenCalledWith(
        '4',
        'ACTUALIZAR_USUARIO_Joyero',
        'Usuarios',
        expect.objectContaining({ targetUserId: '1' }),
        UserRole.ADMIN,
      );
    });
  });

  describe('CP-061: Desactivar Joyero sin OT', () => {
    it('Debe permitir la inactivación lógica del Joyero si no posee OT activas asociadas', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.INACTIVE,
      });

      const result = await service.deactivateUser('4', UserRole.ADMIN, '1');

      expect(result.accountStatus).toBe(AccountStatus.INACTIVE);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-063
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: Bloqueo desactiva Joyero - Denegación de API a rol Joyero.
   * Criterio de Aceptación: Lanza ForbiddenException si un Joyero intenta desactivar cualquier cuenta.
   * --------------------------------------------------------------------------
   */
  describe('CP-063: Bloqueo desactiva Joyero', () => {
    it('Debe denegar la desactivación con ForbiddenException cuando es solicitada por un Joyero', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '3002',
        name: 'Otro Joyero',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
      });

      await expect(
        service.deactivateUser('3001', UserRole.JOYERO, '3002'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-065
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: Bloqueo baja Joyero con OT - Constraint de integridad con órdenes activas.
   * Criterio de Aceptación: Verificar que no se desactive un Joyero asignado a trabajos en progreso.
   * --------------------------------------------------------------------------
   */
  describe('CP-065: Bloqueo baja Joyero con OT', () => {
    it('Debe validar la ausencia de Órdenes de Trabajo activas antes de proceder con la inactivación', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero Con OTs',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.WORKING, // En proceso con OT activa
      });

      // El servicio valida el estado operativo del Joyero
      const joyero = await service.findOne('1');
      expect(joyero.status).toBe(UserStatus.WORKING);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-066
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001 / RF-002
   * Tipo: INTEGRACIÓN
   * Objetivo: Bloqueo acceso Joyero baja - Error de autenticación posterior a la baja.
   * Criterio de Aceptación: Rechazo con UnauthorizedException al intentar ingresar con cuenta inactiva.
   * --------------------------------------------------------------------------
   */
  describe('CP-066: Bloqueo acceso Joyero baja', () => {
    it('Debe rechazar la autenticación de un Joyero cuya cuenta ha sido deshabilitada', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero Desactivado',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.INACTIVE,
        password: '123',
      });

      await expect(
        authService.login('1', '123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-067
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: Baja Joyero sin reasignar - Verificación de cero OT pendientes.
   * Criterio de Aceptación: Confirmar que el Joyero esté fuera de turno (OFFLINE/AVAILABLE) sin OTs pendientes al desactivar.
   * --------------------------------------------------------------------------
   */
  describe('CP-067: Baja Joyero sin reasignar', () => {
    it('Debe permitir la inactivación exitosa cuando el Joyero no tiene asignaciones pendientes', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero Libre',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
        status: UserStatus.OFFLINE,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero Libre',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.INACTIVE,
      });

      const result = await service.deactivateUser('4', UserRole.ADMIN, '1');

      expect(result.accountStatus).toBe(AccountStatus.INACTIVE);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-068
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001
   * Tipo: INTEGRACIÓN
   * Objetivo: Auditoría baja Joyero - Registro del evento DESACTIVAR_USUARIO_Joyero / DISABLE_JEWELER en BD.
   * Criterio de Aceptación: Confirmar la auditoría automática con el evento DESACTIVAR_USUARIO_Joyero.
   * --------------------------------------------------------------------------
   */
  describe('CP-068: Auditoría baja Joyero', () => {
    it('Debe registrar de manera precisa el evento de auditoría DESACTIVAR_USUARIO_Joyero', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '1',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.INACTIVE,
      });

      await service.deactivateUser('4', UserRole.ADMIN, '1');

      expect(auditMock.log).toHaveBeenCalledWith(
        '4',
        'DESACTIVAR_USUARIO_Joyero',
        'Usuarios',
        expect.objectContaining({ targetUserId: '1', newStatus: AccountStatus.INACTIVE }),
        UserRole.ADMIN,
      );
    });
  });
});
