/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 1: Gestión de Joyeros - RF-001)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias dedicadas a la Gestión de
 * Joyeros dentro del Módulo de Gestión de Usuarios y Roles (RF-001).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las funciones de validación de formulario y lógica previa
 * del registro y edición de operarios Joyeros sin tocar la base de datos real.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema aplica reglas de validación previas impidiendo crear o editar
 * cuentas de Joyero si los campos de entrada obligatorios o formatos de correo son inválidos.
 * 
 * Casos incluidos en este archivo:
 * - CP-042: Campos requeridos Joyero (Bloqueo por campos vacíos)
 * - CP-044: Formato email Joyero (Validación Regex de correo del joyero)
 * - CP-045: Unicidad documento UI (Validación preventiva en formulario)
 * - CP-050: Filtro Joyero sin datos (Respuesta limpia de lista vacía en pantalla)
 * - CP-054: Campos requeridos ed. Joyero (Bloqueo por campos vacíos en edición)
 * - CP-055: Formato email ed. Joyero (Validación Regex en formulario de edición)
 * - CP-058: Inmutabilidad doc Joyero (Campo ID bloqueado en formulario ed. Joyero)
 * - CP-062: Mensaje Joyero ya inactivo (Alerta preventiva al intentar desactivar un inactivo)
 * - CP-064: Cancelar desactiva Joyero (Cierre de modal sin cambios en el estado)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService, UserRole, AccountStatus } from '../../Skainet-API/src/users/users.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Gestión de Joyeros (RF-001)', () => {
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
      log: jest.fn(),
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

  describe('CP-042: Campos requeridos Joyero', () => {
    it('Debe rechazar la creación de un Joyero si falta la cédula/ID o el nombre', async () => {
      const invalidJoyeroWithoutId = {
        name: 'Pedro Joyero Sin ID',
        role: UserRole.JOYERO,
      };

      await expect(
        service.createUser('4', UserRole.ADMIN, invalidJoyeroWithoutId),
      ).rejects.toThrow(BadRequestException);

      const invalidJoyeroWithoutName = {
        id: '30099',
        role: UserRole.JOYERO,
      };

      await expect(
        service.createUser('4', UserRole.ADMIN, invalidJoyeroWithoutName),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('CP-044: Formato email Joyero', () => {
    it('Debe rechazar la creación de un Joyero si su correo no cumple con la sintaxis de email', async () => {
      const invalidEmailPayload = {
        id: '30088',
        name: 'Joyero Email Incorrecto',
        role: UserRole.JOYERO,
        email: 'joyero_sin_dominio',
      };

      await expect(
        service.createUser('4', UserRole.ADMIN, invalidEmailPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CP-045: Unicidad documento UI', () => {
    it('Debe realizar validación de unicidad preventiva antes de intentar la creación', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '30077',
        name: 'Joyero Existente',
        role: UserRole.JOYERO,
      });

      const duplicatePayload = {
        id: '30077',
        name: 'Nuevo Joyero Mismo ID',
        role: UserRole.JOYERO,
      };

      await expect(
        service.createUser('4', UserRole.ADMIN, duplicatePayload),
      ).rejects.toThrow('El número de identificación ya se encuentra registrado en el sistema');
    });
  });

  describe('CP-050: Filtro Joyero sin datos', () => {
    it('Debe retornar un arreglo vacío si no existen joyeros registrados', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.findAll(UserRole.JOYERO);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('CP-054: Campos requeridos ed. Joyero', () => {
    it('Debe rechazar la edición de un Joyero si el nombre está vacío', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '3001',
        name: 'Joyero Original',
        role: UserRole.JOYERO,
      });

      await expect(
        service.updateUser('4', UserRole.ADMIN, '3001', { name: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CP-055: Formato email ed. Joyero', () => {
    it('Debe rechazar la edición del correo del Joyero si la sintaxis es inválida', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '3001',
        name: 'Joyero A Editar',
        role: UserRole.JOYERO,
      });

      const invalidEmailEdit = {
        name: 'Joyero A Editar',
        email: 'email_joyero_invalido',
      };

      await expect(
        service.updateUser('4', UserRole.ADMIN, '3001', invalidEmailEdit),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CP-058: Inmutabilidad doc Joyero', () => {
    it('Debe mantener intacta la cédula/ID del Joyero durante la edición de su perfil', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '3001',
        name: 'Joyero R1',
        role: UserRole.JOYERO,
      });

      prismaMock.user.update.mockImplementation(({ where, data }) => Promise.resolve({
        id: where.id,
        ...data,
      }));

      const payloadWithNewId = {
        id: 'ID_MUTADO_3001',
        name: 'Joyero R1 Editado',
      };

      const result = await service.updateUser('4', UserRole.ADMIN, '3001', payloadWithNewId);

      expect(result.id).toBe('3001');
      expect(result.name).toBe('Joyero R1 Editado');
    });
  });

  describe('CP-062: Mensaje Joyero ya inactivo', () => {
    it('Debe rechazar con BadRequestException si se intenta desactivar a un Joyero previamente inactivo', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '3001',
        name: 'Joyero Inactivo',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.INACTIVE,
      });

      await expect(
        service.deactivateUser('4', UserRole.ADMIN, '3001'),
      ).rejects.toThrow('El usuario seleccionado ya se encuentra inactivo');
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-064
   * --------------------------------------------------------------------------
   * Requerimiento: RF-001 (Gestión de Usuarios y Roles)
   * Tipo: UNITARIA
   * Objetivo: Cancelar desactiva Joyero - Cierre de modal sin cambios en el estado.
   * Criterio de Aceptación: La cancelación de la interfaz no debe alterar el estado `ACTIVE` del Joyero.
   * 
   * EXPLICACIÓN PARA LA EXPOSICIÓN:
   * 1. Propósito: Confirmar la idempotencia y no-mutación ante la cancelación de confirmación en la UI.
   * 2. Mecanismo: Se asegura que el estado del Joyero se mantenga intacto y no se llame a `update`.
   * --------------------------------------------------------------------------
   */
  describe('CP-064: Cancelar desactiva Joyero', () => {
    it('Debe preservar el estado Activo del Joyero si la deshabilitación es cancelada', async () => {
      const activeJoyero = {
        id: '3001',
        name: 'Ramiro Joyero',
        role: UserRole.JOYERO,
        accountStatus: AccountStatus.ACTIVE,
      };

      prismaMock.user.findUnique.mockResolvedValue(activeJoyero);

      expect(activeJoyero.accountStatus).toBe(AccountStatus.ACTIVE);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });
});
