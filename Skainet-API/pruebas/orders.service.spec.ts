import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../src/orders/orders.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService, UserStatus } from '../src/users/users.service';
import { BatchesService } from '../src/batches/batches.service';
import { AlertsService } from '../src/alerts/alerts.service';

describe('OrdersService - Pruebas Unitarias', () => {
  let service: OrdersService;
  let prismaMock: any;
  let usersServiceMock: any;
  let batchesServiceMock: any;
  let alertsServiceMock: any;

  const mockUserReceiver = { id: '4', name: 'Danna', role: 'Administrador' };
  const mockUserExecutor = { id: '1', name: 'Ramiro', role: 'Joyero' };
  const mockRing = { id: 'B-101-R1', name: 'Anillo 1', securePin: '1111', status: 'PENDING' };

  beforeEach(async () => {
    prismaMock = {
      workOrder: {
        count: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    usersServiceMock = {
      findOne: jest.fn(),
      updateStatus: jest.fn(),
    };

    batchesServiceMock = {
      getRingById: jest.fn(),
      updateRingStatus: jest.fn(),
    };

    alertsServiceMock = {
      createAlert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: BatchesService, useValue: batchesServiceMock },
        { provide: AlertsService, useValue: alertsServiceMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('1. create: Debe crear una orden de trabajo exitosamente y actualizar estado del joyero y anillo', async () => {
    usersServiceMock.findOne.mockImplementation(async (id: string) => {
      if (id === '4') return mockUserReceiver;
      if (id === '1') return mockUserExecutor;
      return null;
    });
    prismaMock.workOrder.findFirst.mockResolvedValue(null);
    batchesServiceMock.getRingById.mockResolvedValue(mockRing);

    const createdDbOrder = {
      id: 'ORD-12345',
      ringId: 'B-101-R1',
      ringName: 'Anillo 1',
      receiverId: '4',
      executorId: '1',
      weights: JSON.stringify({ anillo: 10, plastilina: 1, bolsa: 0.5 }),
      totalWeight: 11.5,
      status: 'OPEN',
    };
    prismaMock.workOrder.create.mockResolvedValue(createdDbOrder);

    const res = await service.create({
      ringId: 'B-101-R1',
      receiverId: '4',
      executorId: '1',
      weights: { anillo: 10, plastilina: 1, bolsa: 0.5 },
      providedPin: '1111',
    });

    expect(usersServiceMock.updateStatus).toHaveBeenCalledWith('1', UserStatus.WORKING);
    expect(batchesServiceMock.updateRingStatus).toHaveBeenCalledWith('B-101-R1', 'ASSIGNED');
    expect(res.id).toBe('ORD-12345');
    expect(res.totalWeight).toBe(11.5);
  });

  it('2. create: Debe lanzar NotFoundException si no existe el joyero receptor o ejecutor', async () => {
    usersServiceMock.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        ringId: 'B-101-R1',
        receiverId: '99',
        executorId: '1',
        weights: { anillo: 10, plastilina: 1, bolsa: 0.5 },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('3. create: Debe lanzar BadRequestException si el joyero ejecutor ya tiene una orden abierta', async () => {
    usersServiceMock.findOne.mockImplementation(async (id: string) => mockUserExecutor);
    prismaMock.workOrder.findFirst.mockResolvedValue({ id: 'ORD-OPEN', status: 'OPEN' });

    await expect(
      service.create({
        ringId: 'B-101-R1',
        receiverId: '4',
        executorId: '1',
        weights: { anillo: 10, plastilina: 1, bolsa: 0.5 },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('4. create: Debe lanzar BadRequestException si la clave secreta PIN proporcionada es incorrecta', async () => {
    usersServiceMock.findOne.mockImplementation(async (id: string) => mockUserExecutor);
    prismaMock.workOrder.findFirst.mockResolvedValue(null);
    batchesServiceMock.getRingById.mockResolvedValue(mockRing);

    await expect(
      service.create({
        ringId: 'B-101-R1',
        receiverId: '4',
        executorId: '1',
        weights: { anillo: 10, plastilina: 1, bolsa: 0.5 },
        providedPin: '9999',
      }),
    ).rejects.toThrow('Clave secreta incorrecta para tomar pieza');
  });

  it('5. closeOrder: Debe cerrar una orden correctamente cuando la merma está en la tolerancia (<= 0.05)', async () => {
    const activeOrder = {
      id: 'ORD-101',
      ringId: 'B-101-R1',
      ringName: 'Anillo 1',
      executorId: '1',
      totalWeight: 10.0,
      startTime: new Date(Date.now() - 30 * 60 * 1000),
      status: 'OPEN',
    };
    prismaMock.workOrder.findUnique.mockResolvedValue(activeOrder);
    batchesServiceMock.getRingById.mockResolvedValue(mockRing);

    prismaMock.workOrder.update.mockResolvedValue({
      ...activeOrder,
      status: 'CLOSED',
      loss: 0.02,
      isAnomaly: false,
    });

    const res = await service.closeOrder(
      'ORD-101',
      { anillo: 8.8, plastilina: 0.5, bolsa: 0.68 }, // total 9.98 => loss 0.02
      undefined,
      '1111',
    );

    expect(usersServiceMock.updateStatus).toHaveBeenCalledWith('1', UserStatus.AVAILABLE);
    expect(batchesServiceMock.updateRingStatus).toHaveBeenCalledWith('B-101-R1', 'PENDING', expect.any(String));
    expect(res.newGeneratedPin).toBeDefined();
  });

  it('6. closeOrder: Debe exigir explicación en caso de merma anómala (> 0.05)', async () => {
    const activeOrder = {
      id: 'ORD-101',
      ringId: 'B-101-R1',
      executorId: '1',
      totalWeight: 10.0,
      status: 'OPEN',
    };
    prismaMock.workOrder.findUnique.mockResolvedValue(activeOrder);
    batchesServiceMock.getRingById.mockResolvedValue(mockRing);

    // Final total = 9.0 => loss 1.0 > 0.05 -> Anomalia sin explicación
    await expect(
      service.closeOrder(
        'ORD-101',
        { anillo: 8.0, plastilina: 0.5, bolsa: 0.5 },
        undefined,
        '1111',
      ),
    ).rejects.toThrow('Se requiere una explicación para la anomalía de peso');
  });

  it('7. closeOrder: Debe crear una alerta de peso crítico al cerrar con anomalía explicada', async () => {
    const activeOrder = {
      id: 'ORD-101',
      ringId: 'B-101-R1',
      ringName: 'Anillo 1',
      executorId: '1',
      totalWeight: 10.0,
      startTime: new Date(Date.now() - 60 * 60 * 1000),
      status: 'OPEN',
    };
    prismaMock.workOrder.findUnique.mockResolvedValue(activeOrder);
    batchesServiceMock.getRingById.mockResolvedValue(mockRing);
    usersServiceMock.findOne.mockResolvedValue(mockUserExecutor);

    prismaMock.workOrder.update.mockResolvedValue({
      ...activeOrder,
      status: 'CLOSED',
      loss: 0.5,
      isAnomaly: true,
    });

    await service.closeOrder(
      'ORD-101',
      { anillo: 8.5, plastilina: 0.5, bolsa: 0.5 },
      'Exceso de limado por porosidad',
      '1111',
    );

    expect(alertsServiceMock.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'WEIGHT',
        severity: 'CRITICAL',
        jewelerName: 'Ramiro',
      }),
    );
  });

  it('8. findActiveByExecutor: Debe retornar la orden abierta del joyero o null si no existe', async () => {
    prismaMock.workOrder.findFirst.mockResolvedValue(null);
    const none = await service.findActiveByExecutor('1');
    expect(none).toBeNull();

    const activeOrder = { id: 'ORD-1', executorId: '1', status: 'OPEN', weights: '{"anillo": 5}' };
    prismaMock.workOrder.findFirst.mockResolvedValue(activeOrder);
    const active = await service.findActiveByExecutor('1');
    expect(active.id).toBe('ORD-1');
  });
});
