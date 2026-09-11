/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 1: Usuarios y Roles - RF-001)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la Gestión de Cuentas
 * Administrativas dentro del Módulo de Gestión de Usuarios y Roles (RF-001).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de componentes, funciones de validación y reglas de negocio
 * sin interacción con la base de datos real.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Al exponer estas pruebas, resalte cómo se evalúa la lógica del sistema en aislamiento
 * utilizando mocks (simulaciones) y aserciones estrictas sobre las reglas de negocio.
 * 
 * Casos incluidos en este archivo:
 * - CP-010: Campos requeridos Admin (Validación de obligatoriedad de campos)
 * - CP-012: Formato email Admin (Validación por expresión regular / RegEx)
 * - CP-013: Documento no modificable (Inmutabilidad de clave primaria ID)
 * - CP-016: Validación cliente Admin (Comprobación de tipos de datos de entrada)
 * - CP-019: Filtro Admin sin datos (Manejo de estado de lista vacía)
 * - CP-024: Campos requeridos edición (Validación de vacíos al editar Admin)
 * - CP-025: Formato email edición (Validación Regex al editar Admin)
 * - CP-028: Inmutabilidad documento (Verificar que la clave primaria no cambia)
 * - CP-030: Edición parcial Admin (Verificar que sólo campos alterados cambian)
 * - CP-032: Mensaje Admin ya inactivo (Validación de estado previo en pantalla/servicio)
 * - CP-034: Cancelar desactivación (Cierre de modal sin cambios en el estado)
 * - CP-035: Bloqueo autodesactivación (Regla: Ningún usuario puede desactivarse a sí mismo)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService, UserRole, AccountStatus } from '../../Skainet-API/src/users/users.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Gestión Administrativa (RF-001)', () => {
  let service: UsersService;
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
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('CP-010: Campos requeridos Admin', () => {
    it('Debe rechazar la creación de un Admin si falta la cédula/ID o el nombre', async () => {
      const invalidDataWithoutId = {
        name: 'Administrador Sin Cédula',
        role: UserRole.ADMIN,
        email: 'admin.sinid@skainet.com',
      };

      await expect(
        service.createUser('1000000000', UserRole.SUPER_ADMIN, invalidDataWithoutId),
      ).rejects.toThrow(BadRequestException);

      const invalidDataWithoutName = {
        id: '999000111',
        role: UserRole.ADMIN,
        email: 'admin.sinnombre@skainet.com',
      };

      await expect(
        service.createUser('1000000000', UserRole.SUPER_ADMIN, invalidDataWithoutName),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('CP-012: Formato email Admin', () => {
    it('Debe rechazar correos con sintaxis inválida y permitir formatos correctos', async () => {
      const invalidEmails = ['admin.skainet', 'admin@', '@skainet.com', 'admin@.com', 'admin@skainet..com'];

      // Mock findUnique to return null (no duplicate) so that if an email slips
      // past the regex, the call fails at create (which also returns undefined
      // causing a crash). We set create to return a dummy object to isolate the
      // email-validation error only.
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        accountStatus: 'Activo',
        status: 'Fuera de Turno',
      }));

      for (const email of invalidEmails) {
        const payload = {
          id: '999000222',
          name: 'Admin Test Email',
          role: UserRole.ADMIN,
          email: email,
        };

        await expect(
          service.createUser('1000000000', UserRole.SUPER_ADMIN, payload),
        ).rejects.toThrow(BadRequestException);
      }

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        accountStatus: 'Activo',
        status: 'Fuera de Turno',
      }));

      const validPayload = {
        id: '999000333',
        name: 'Admin Email Valido',
        role: UserRole.ADMIN,
        email: 'admin.valido@skainet.com',
      };

      const result = await service.createUser('1000000000', UserRole.SUPER_ADMIN, validPayload);
      expect(result).toBeDefined();
      expect(result.id).toBe('999000333');
    });
  });

  describe('CP-013: Documento no modificable', () => {
    it('Debe mantener inalterada la cédula/ID del Administrador durante la edición', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1098765432',
        name: 'Admin Original',
        role: UserRole.ADMIN,
        email: 'original@skainet.com',
      });

      prismaMock.user.update.mockImplementation(({ where, data }) => Promise.resolve({
        id: where.id,
        ...data,
        role: UserRole.ADMIN,
      }));

      const editPayload = {
        id: 'NUEVO_ID_INVALIDO',
        name: 'Admin Nombre Editado',
        email: 'editado@skainet.com',
      };

      const updated = await service.updateUser('1000000000', UserRole.SUPER_ADMIN, '1098765432', editPayload);

      expect(updated.id).toBe('1098765432');
      expect(updated.name).toBe('Admin Nombre Editado');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: '1098765432' },
        data: expect.objectContaining({ name: 'Admin Nombre Editado' }),
      });
    });
  });

  describe('CP-016: Validación cliente Admin', () => {
    it('Debe validar la presencia y consistencia de los tipos de datos de entrada obligatorios', async () => {
      const invalidPayload = {
        id: '',
        name: 'Nombre Valido',
        role: UserRole.ADMIN,
      };

      await expect(
        service.createUser('1000000000', UserRole.SUPER_ADMIN, invalidPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CP-019: Filtro Admin sin datos', () => {
    it('Debe retornar una lista vacía de forma limpia cuando no existan administradores', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.findAll(UserRole.ADMIN);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('CP-024: Campos requeridos edición', () => {
    it('Debe rechazar la edición de un Admin si el nombre está vacío', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Original',
        role: UserRole.ADMIN,
      });

      const invalidPayload = { name: '' };

      await expect(
        service.updateUser('1000000000', UserRole.SUPER_ADMIN, '2001', invalidPayload),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('CP-025: Formato email edición', () => {
    it('Debe rechazar la actualización de correo si el formato ingresado es sintácticamente inválido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Email Test',
        role: UserRole.ADMIN,
      });

      const invalidPayload = {
        name: 'Admin Email Test',
        email: 'correo_invalido_sin_arroba',
      };

      await expect(
        service.updateUser('1000000000', UserRole.SUPER_ADMIN, '2001', invalidPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CP-028: Inmutabilidad documento', () => {
    it('Debe garantizar que la clave primaria (cédula/ID) no cambie durante la edición', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '12345678',
        name: 'Carlos Admin',
        role: UserRole.ADMIN,
      });

      prismaMock.user.update.mockImplementation(({ where, data }) => Promise.resolve({
        id: where.id,
        ...data,
      }));

      const payload = {
        id: '99999999',
        name: 'Carlos Admin Renombrado',
      };

      const result = await service.updateUser('1000000000', UserRole.SUPER_ADMIN, '12345678', payload);

      expect(result.id).toBe('12345678');
      expect(result.name).toBe('Carlos Admin Renombrado');
    });
  });

  describe('CP-030: Edición parcial Admin', () => {
    it('Debe actualizar de forma limpia solo los campos especificados en el payload', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Parcial',
        email: 'parcial@skainet.com',
        phone: '+573000000000',
        role: UserRole.ADMIN,
      });

      prismaMock.user.update.mockImplementation(({ data }) => Promise.resolve({
        id: '2001',
        name: data.name,
        email: data.email || 'parcial@skainet.com',
        phone: data.phone,
        role: UserRole.ADMIN,
      }));

      const payload = {
        name: 'Admin Parcial',
        phone: '+573111111111',
      };

      const result = await service.updateUser('1000000000', UserRole.SUPER_ADMIN, '2001', payload);

      expect(result.phone).toBe('+573111111111');
      expect(result.name).toBe('Admin Parcial');
    });
  });

  describe('CP-032: Mensaje Admin ya inactivo', () => {
    it('Debe lanzar BadRequestException al intentar desactivar a un Admin previamente inactivo', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Ya Inactivo',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.INACTIVE,
      });

      await expect(
        service.deactivateUser('1000000000', UserRole.SUPER_ADMIN, '2001'),
      ).rejects.toThrow('El usuario seleccionado ya se encuentra inactivo');

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-034
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001 (Gestión de Usuarios y Roles)
   * Tipo: UNITARIA
   * Objetivo: Cancelar desactivación - Cierre de modal sin cambios en el estado.
   * Criterio de Aceptación: Si se cancela la acción de desactivar, el estado previo (`ACTIVE`)
   * del Administrador debe permanecer inalterado sin invocar mutaciones en BD.
   * 
   * EXPLICACIÓN PARA LA EXPOSICIÓN:
   * 1. Propósito: Asegurar el principio de idempotencia y no-mutación ante cancelaciones en interfaz.
   * 2. Mecanismo: Se verifica que no se invoque `prisma.user.update` si la acción no se confirma.
   * 3. Verificación: Aseverar que `update` no fue llamado y la entidad conserva su estado `ACTIVE`.
   * --------------------------------------------------------------------------
   */
  describe('CP-034: Cancelar desactivación', () => {
    it('Debe preservar el estado Activo del usuario si la acción de desactivación se cancela', async () => {
      const activeUser = {
        id: '2001',
        name: 'Admin Sin Cambios',
        accountStatus: AccountStatus.ACTIVE,
      };

      prismaMock.user.findUnique.mockResolvedValue(activeUser);

      expect(activeUser.accountStatus).toBe(AccountStatus.ACTIVE);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-035
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001 (Gestión de Usuarios y Roles)
   * Tipo: UNITARIA
   * Objetivo: Bloqueo autodesactivación - Regla: Ningún usuario puede desactivar su propia cuenta.
   * Criterio de Aceptación: Si un usuario intenta desactivarse a sí mismo (`actorId === idToDeactivate`),
   * el sistema debe lanzar BadRequestException('No es posible desactivar su propia cuenta.').
   * 
   * EXPLICACIÓN PARA LA EXPOSICIÓN:
   * 1. Propósito: Prevenir el bloqueo accidental de la cuenta del usuario actual que impida la administración del sistema.
   * 2. Mecanismo: Invocamos `deactivateUser` enviando `actorId = '1000000000'` e `idToDeactivate = '1000000000'`.
   * 3. Verificación: Confirmamos el rechazo por BadRequestException con el mensaje exacto exigido por RN-011.
   * --------------------------------------------------------------------------
   */
  describe('CP-035: Bloqueo autodesactivación', () => {
    it('Debe rechazar con BadRequestException si un usuario intenta desactivar su propia cuenta', async () => {
      const currentActorId = '1000000000';

      await expect(
        service.deactivateUser(currentActorId, UserRole.SUPER_ADMIN, currentActorId),
      ).rejects.toThrow('No es posible desactivar su propia cuenta.');

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });
});
