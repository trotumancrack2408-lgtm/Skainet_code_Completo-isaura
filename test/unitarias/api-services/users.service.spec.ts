import { Test, TestingModule } from '@nestjs/testing';
import { UsersService, UserRole, UserStatus } from '../../../Skainet-API/src/users/users.service';
import { PrismaService } from '../../../Skainet-API/src/prisma/prisma.service';

describe('UsersService - Pruebas Unitarias', () => {
  let service: UsersService;
  let prismaMock: any;

  const rawUser = {
    id: '1',
    name: 'Ramiro',
    role: UserRole.JOYERO,
    status: UserStatus.OFFLINE,
    password: '123',
    phone: '+573001112233',
    history: JSON.stringify([{ status: UserStatus.OFFLINE, timestamp: '2026-01-01' }]),
    securityQuestions: JSON.stringify([
      { question: 'Mascota', answer: 'Toby' },
      { question: 'Comida', answer: 'Pizza' },
      { question: 'Ciudad', answer: 'Cali' },
    ]),
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        count: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('1. findAll: Debe retornar todos los usuarios excluyendo la contraseña y parseando JSON', async () => {
    prismaMock.user.findMany.mockResolvedValue([rawUser]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(result[0].password).toBeUndefined();
    expect(result[0].name).toBe('Ramiro');
    expect(Array.isArray(result[0].history)).toBe(true);
    expect(Array.isArray(result[0].securityQuestions)).toBe(true);
  });

  it('2. findOne: Debe buscar un usuario sin exponer las respuestas de seguridad', async () => {
    prismaMock.user.findUnique.mockResolvedValue(rawUser);

    const user = await service.findOne('1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(user.id).toBe('1');
    expect(user.securityQuestions[0].question).toBe('Mascota');
    expect(user.securityQuestions[0].answer).toBeUndefined();
  });

  it('3. validatePassword: Debe retornar el usuario si la clave coincide', async () => {
    prismaMock.user.findUnique.mockResolvedValue(rawUser);

    const user = await service.validatePassword('1', '123');

    expect(user).not.toBeNull();
    expect(user.id).toBe('1');
    expect(user.password).toBeUndefined();
  });

  it('4. validatePassword: Debe retornar null si la contraseña es incorrecta o usuario inexistente', async () => {
    prismaMock.user.findUnique.mockResolvedValue(rawUser);
    const userErrado = await service.validatePassword('1', 'clave_falsa');
    expect(userErrado).toBeNull();

    prismaMock.user.findUnique.mockResolvedValue(null);
    const noExiste = await service.validatePassword('99', '123');
    expect(noExiste).toBeNull();
  });

  it('5. updateStatus: Debe actualizar el estado y registrar la entrada en el historial', async () => {
    prismaMock.user.findUnique.mockResolvedValue(rawUser);
    prismaMock.user.update.mockImplementation(({ data }) => ({
      ...rawUser,
      status: data.status,
      history: data.history,
    }));

    const updated = await service.updateStatus('1', UserStatus.WORKING);

    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(updated.status).toBe(UserStatus.WORKING);
  });

  it('6. updateStatus: Debe actualizar lastLogin cuando el estado pase a AVAILABLE', async () => {
    prismaMock.user.findUnique.mockResolvedValue(rawUser);
    prismaMock.user.update.mockResolvedValue({
      ...rawUser,
      status: UserStatus.AVAILABLE,
      lastLogin: new Date(),
    });

    await service.updateStatus('1', UserStatus.AVAILABLE);

    const updateCallArg = prismaMock.user.update.mock.calls[0][0];
    expect(updateCallArg.data.lastLogin).toBeInstanceOf(Date);
  });

  it('7. create: Debe crear un nuevo usuario y validar campos obligatorios y duplicidad', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: '10',
      name: 'Nuevo Joyero',
      role: UserRole.JOYERO,
      status: UserStatus.OFFLINE,
      password: '123',
      history: JSON.stringify([]),
      securityQuestions: JSON.stringify([]),
    });

    const newUser = await service.create({ id: '10', name: 'Nuevo Joyero' });

    expect(newUser.id).toBe('10');
    expect(newUser.name).toBe('Nuevo Joyero');

    // Validación de errores
    await expect(service.create({ name: 'Sin ID' })).rejects.toThrow('El ID y el Nombre son obligatorios');

    prismaMock.user.findUnique.mockResolvedValue(rawUser);
    await expect(service.create({ id: '1', name: 'Existente' })).rejects.toThrow('El ID de usuario ya existe');
  });

  it('8. validateRecovery: Debe validar respuestas de recuperación sin importar mayúsculas o espacios', async () => {
    prismaMock.user.findUnique.mockResolvedValue(rawUser);

    const result = await service.validateRecovery('1', [' TOBY ', 'pizza', 'cali']);
    expect(result).not.toBeNull();

    const resultFail = await service.validateRecovery('1', ['toby', 'incorrecta', 'cali']);
    expect(resultFail).toBeNull();
  });
});
