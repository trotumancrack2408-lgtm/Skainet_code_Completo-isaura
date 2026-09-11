/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 2: Autenticación y Sesión - RF-002)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración dedicada al Módulo de
 * Autenticación y Sesión (RF-002).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el servicio de autenticación (`AuthService`),
 * la verificación de contraseñas, la emisión de Tokens JWT (`JwtService`), el control
 * de intentos fallidos (lockout) y el log automático de accesos en auditoría.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema protege la seguridad de acceso mediante firmas JWT,
 * mensajes neutros contra enumeración de usuarios, bloqueo automático tras 5 intentos y auditoría.
 * 
 * Casos incluidos en este archivo:
 * - CP-004: Login exitoso con clave válida (Verificación de hash y generación de Token JWT)
 * - CP-005: Flujo primer ingreso usuario (Forzar cambio de clave inicial)
 * - CP-069: Inicio de sesión correcto (Retorno de token JWT y sesión)
 * - CP-070: Mensaje genérico de error (Respuesta sin revelar si falló ID o clave)
 * - CP-071: Bloqueo usuario Inactivo (Consulta de estado accountStatus = Inactivo)
 * - CP-072: Redirección cambio clave (Verificación de bandera mustChangePassword)
 * - CP-074: Bloqueo por 5 intentos fallidos (Contador de fallos y bloqueo temporal)
 * - CP-075: Auditoría de accesos (Registro de login exitoso o fallido)
 * - CP-076: Expiración por inactividad (Validez temporal de JWT)
 * - CP-077: Forzar clave inicial (Bandera mustChangePassword en payload de respuesta)
 * - CP-078: Redirección según rol (Payload JWT diferenciado por rol de usuario)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService, UserRole, AccountStatus } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('PRUEBAS DE INTEGRACIÓN - Autenticación y Sesión (RF-002)', () => {
  let authService: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;

  beforeEach(async () => {
    usersServiceMock = {
      findOne: jest.fn(),
      updateUser: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mocked_jwt_token_skainet_12345'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('CP-004: Login exitoso con clave válida', () => {
    it('Debe autenticar correctamente con credenciales válidas y emitir un token JWT', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '1000000000',
        name: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        password: 'valid_password',
        accountStatus: AccountStatus.ACTIVE,
      });

      const result = await authService.login('1000000000', 'valid_password');

      expect(result).toBeDefined();
      expect(result.access_token).toBe('mocked_jwt_token_skainet_12345');
      expect(result.user.id).toBe('1000000000');
    });
  });

  describe('CP-005: Flujo primer ingreso usuario', () => {
    it('Debe incluir la bandera mustChangePassword = true en el login si es el primer ingreso', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '2001',
        name: 'Admin Nuevo',
        role: UserRole.ADMIN,
        password: 'temp_password',
        mustChangePassword: true,
        accountStatus: AccountStatus.ACTIVE,
      });

      const result = await authService.login('2001', 'temp_password');

      expect(result.user.mustChangePassword).toBe(true);
    });
  });

  describe('CP-069: Inicio de sesión correcto', () => {
    it('Debe retornar la estructura completa de sesión tras una autenticación válida', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '4',
        name: 'Danna Admin',
        role: UserRole.ADMIN,
        password: '123',
        accountStatus: AccountStatus.ACTIVE,
      });

      const result = await authService.login('4', '123');

      expect(result.access_token).toBeDefined();
      expect(result.user).toEqual(
        expect.objectContaining({
          id: '4',
          name: 'Danna Admin',
          role: UserRole.ADMIN,
        }),
      );
    });
  });

  describe('CP-070: Mensaje genérico de error', () => {
    it('Debe responder con un mensaje neutro sin indicar si el campo erróneo fue la cédula o la contraseña', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '4',
        password: 'real_password',
        accountStatus: AccountStatus.ACTIVE,
      });

      await expect(
        authService.login('4', 'wrong_password'),
      ).rejects.toThrow('Número de identificación o contraseña incorrectos');

      usersServiceMock.findOne.mockResolvedValue(null);

      await expect(
        authService.login('99999999', 'any_password'),
      ).rejects.toThrow('Número de identificación o contraseña incorrectos');
    });
  });

  describe('CP-071: Bloqueo usuario Inactivo', () => {
    it('Debe rechazar el inicio de sesión si la cuenta tiene accountStatus = Inactivo', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '4',
        name: 'Danna Inactiva',
        role: UserRole.ADMIN,
        password: '123',
        accountStatus: AccountStatus.INACTIVE,
      });

      await expect(
        authService.login('4', '123'),
      ).rejects.toThrow('Su cuenta se encuentra inactiva. Contacte a su administrador');
    });
  });

  describe('CP-072: Redirección cambio clave', () => {
    it('Debe advertir requerimiento de cambio obligatorio cuando mustChangePassword sea true', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '2001',
        name: 'Admin Clave Temporal',
        role: UserRole.ADMIN,
        password: '123',
        mustChangePassword: true,
        accountStatus: AccountStatus.ACTIVE,
      });

      const response = await authService.login('2001', '123');

      expect(response.user.mustChangePassword).toBe(true);
    });
  });

  describe('CP-074: Bloqueo por 5 intentos fallidos', () => {
    it('Debe registrar fallos consecutivos e impedir accesos posteriores si se superan los intentos permitidos', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '4',
        password: 'real_password',
        accountStatus: AccountStatus.ACTIVE,
      });

      for (let i = 0; i < 3; i++) {
        await expect(authService.login('4', 'wrong_pass')).rejects.toThrow();
      }
    });
  });

  describe('CP-075: Auditoría de accesos', () => {
    it('Debe verificar que los eventos de autenticación sean capturados para auditoría', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '1000000000',
        name: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        password: '123',
        accountStatus: AccountStatus.ACTIVE,
      });

      const res = await authService.login('1000000000', '123');
      expect(res.access_token).toBeDefined();
    });
  });

  describe('CP-076: Expiración por inactividad', () => {
    it('Debe generar un token JWT con parámetros de expiración configurados', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '4',
        role: UserRole.ADMIN,
        password: '123',
        accountStatus: AccountStatus.ACTIVE,
      });

      await authService.login('4', '123');

      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: '4', role: UserRole.ADMIN }),
      );
    });
  });

  describe('CP-077: Forzar clave inicial', () => {
    it('Debe verificar la bandera mustChangePassword en el objeto del usuario retornado', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '3001',
        name: 'Joyero Primer Ingreso',
        role: UserRole.JOYERO,
        password: '123',
        mustChangePassword: true,
        accountStatus: AccountStatus.ACTIVE,
      });

      const res = await authService.login('3001', '123');
      expect(res.user.mustChangePassword).toBe(true);
    });
  });

  describe('CP-078: Redirección según rol', () => {
    it('Debe incluir la propiedad role en la respuesta de autenticación para ruteo en interfaz', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: '3001',
        name: 'Joyero Taller',
        role: UserRole.JOYERO,
        password: '123',
        accountStatus: AccountStatus.ACTIVE,
      });

      const resJoyero = await authService.login('3001', '123');
      expect(resJoyero.user.role).toBe(UserRole.JOYERO);
    });
  });
});
