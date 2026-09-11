/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 2: Autenticación y Sesión - RF-002)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la autenticación
 * de usuarios y validación previa de credenciales (RF-002).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las funciones de validación de formulario y lógica previa
 * de inicio de sesión sin invocar servicios de base de datos ni firmas JWT reales.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema valida la presencia obligatoria de las credenciales de entrada
 * antes de intentar autenticar contra la base de datos.
 * 
 * Casos incluidos en este archivo:
 * - CP-073: Campos login vacíos (Validación frontend/servicio previa al envío de request)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Autenticación y Sesión (RF-002)', () => {
  let authService: AuthService;
  let usersServiceMock: any;

  beforeEach(async () => {
    usersServiceMock = {
      findOne: jest.fn(),
      updateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('CP-073: Campos login vacíos', () => {
    it('Debe rechazar el intento de inicio de sesión si la cédula o la contraseña están vacías', async () => {
      await expect(authService.login('', '123456')).rejects.toThrow(UnauthorizedException);
      await expect(authService.login('1000000000', '')).rejects.toThrow(UnauthorizedException);
      await expect(authService.login('', '')).rejects.toThrow(UnauthorizedException);

      expect(usersServiceMock.findOne).not.toHaveBeenCalled();
    });
  });
});
