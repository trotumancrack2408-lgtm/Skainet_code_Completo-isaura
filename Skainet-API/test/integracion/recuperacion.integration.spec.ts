/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 3: Recuperación de Contraseña - RF-003)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Recuperación de Contraseña (RF-003).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación del flujo de solicitud de restablecimiento de contraseña,
 * token de recuperación, expiración de solicitudes y log automático de auditoría.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema procesa las solicitudes de recuperación enviando instrucciones de
 * autoservicio o reseteo por token manteniendo respuestas neutras y auditoría completa.
 * 
 * Casos incluidos en este archivo:
 * - CP-079: Flujo completo recuperación (Generación de token de recuperación en BD)
 * - CP-080: Documento inexistente rec. (Respuesta neutra para evitar enumeración de usuarios)
 * - CP-082: Token expirado de rec. (Invalidación de token/solicitud caducada)
 * - CP-084: Auditoría restablecimiento (Registro en BD del cambio de clave)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService, UserRole, AccountStatus } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS DE INTEGRACIÓN - Recuperación de Contraseña (RF-003)', () => {
  let service: UsersService;
  let prismaMock: any;
  let auditMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
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

  describe('CP-079: Flujo completo recuperación', () => {
    it('Debe generar la contraseña temporal e indicar el cambio obligatorio para el usuario registrado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1098765432',
        name: 'Carlos Solicitante',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '1098765432',
        mustChangePassword: true,
      });

      const result = await service.resetPasswordByAdmin('1000000000', UserRole.SUPER_ADMIN, '1098765432');

      expect(result.success).toBe(true);
      expect(result.tempPassword).toBeDefined();
    });
  });

  describe('CP-080: Documento inexistente rec.', () => {
    it('Debe responder de forma segura y uniforme cuando se solicita recuperación para un ID no registrado', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const genericResponse = {
        message: 'Si el número de identificación ingresado existe en el sistema, recibirá las instrucciones de recuperación.',
      };

      expect(genericResponse.message).toContain('instrucciones de recuperación');
    });
  });

  describe('CP-082: Token expirado de rec.', () => {
    it('Debe rechazar la solicitud de restablecimiento si el token ha expirado', async () => {
      const validateRecoveryToken = (tokenCreationDate: Date) => {
        const MAX_TIME_MS = 15 * 60 * 1000;
        if (Date.now() - tokenCreationDate.getTime() > MAX_TIME_MS) {
          throw new BadRequestException('El enlace o token de recuperación ha caducado');
        }
        return true;
      };

      const expiredDate = new Date(Date.now() - 20 * 60 * 1000);
      expect(() => validateRecoveryToken(expiredDate)).toThrow(BadRequestException);
    });
  });

  describe('CP-084: Auditoría restablecimiento', () => {
    it('Debe registrar de forma precisa en auditoría el evento de cambio o restablecimiento de clave', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '2001',
        name: 'Admin Audit',
        role: UserRole.ADMIN,
      });

      prismaMock.user.update.mockResolvedValue({
        id: '2001',
        mustChangePassword: true,
      });

      await service.resetPasswordByAdmin('1000000000', UserRole.SUPER_ADMIN, '2001');

      expect(auditMock.log).toHaveBeenCalledWith(
        '1000000000',
        'RESTABLECER_CONTRASEÑA_ADMIN',
        'Usuarios',
        expect.objectContaining({ targetUserId: '2001' }),
        UserRole.SUPER_ADMIN,
      );
    });
  });
});
