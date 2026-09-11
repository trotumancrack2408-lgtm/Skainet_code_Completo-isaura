import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService, UserRole, UserStatus } from '../../src/users/users.service';

describe('AuthService - Pruebas Unitarias', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  const mockUser = {
    id: '5',
    name: 'Viralsquad',
    role: UserRole.ADMIN,
    status: UserStatus.AVAILABLE,
    history: [],
  };

  beforeEach(async () => {
    usersService = {
      validatePassword: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('1. Debe realizar login exitosamente con credenciales válidas (CP-022)', async () => {
    (usersService.validatePassword as jest.Mock).mockResolvedValue(mockUser);
    (jwtService.sign as jest.Mock).mockReturnValue('token_jwt_valido');

    const result = await service.login('5', 'admin');

    expect(usersService.validatePassword).toHaveBeenCalledWith('5', 'admin');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '5',
      username: 'Viralsquad',
      role: UserRole.ADMIN,
    });
    expect(result).toEqual(expect.objectContaining({
      ...mockUser,
      access_token: 'token_jwt_valido',
    }));
  });

  it('2. Debe lanzar UnauthorizedException con mensaje genérico cuando la contraseña sea incorrecta (CP-023)', async () => {
    (usersService.validatePassword as jest.Mock).mockResolvedValue(null);

    await expect(service.login('5', 'password_errada')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('3. Debe lanzar UnauthorizedException cuando el usuario no existe (CP-024)', async () => {
    (usersService.validatePassword as jest.Mock).mockResolvedValue(null);

    await expect(service.login('999', '123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('4. Debe armar el payload de JWT con id, username y rol del usuario', async () => {
    (usersService.validatePassword as jest.Mock).mockResolvedValue(mockUser);
    (jwtService.sign as jest.Mock).mockReturnValue('token_test');

    await service.login('5', 'admin');

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: mockUser.id,
      username: mockUser.name,
      role: mockUser.role,
    });
  });

  it('5. Debe retornar la estructura completa de usuario conservando sus campos', async () => {
    (usersService.validatePassword as jest.Mock).mockResolvedValue(mockUser);
    (jwtService.sign as jest.Mock).mockReturnValue('jwt_token_123');

    const response = await service.login('5', 'admin');

    expect(response.id).toBe('5');
    expect(response.name).toBe('Viralsquad');
    expect(response.access_token).toBe('jwt_token_123');
  });
});
