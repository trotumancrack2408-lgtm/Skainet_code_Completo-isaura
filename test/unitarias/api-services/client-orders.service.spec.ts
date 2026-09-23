import { Test, TestingModule } from '@nestjs/testing';
import { ClientOrdersService } from '../../../Skainet-API/src/client-orders/client-orders.service';
import { PrismaService } from '../../../Skainet-API/src/prisma/prisma.service';
import { NotificationsService } from '../../../Skainet-API/src/notifications/notifications.service';

describe('ClientOrdersService - Pruebas Unitarias', () => {
  let service: ClientOrdersService;
  let prismaMock: any;
  let notificationsServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      clientOrder: {
        count: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    notificationsServiceMock = {
      notifyClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientOrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<ClientOrdersService>(ClientOrdersService);
  });

  it('1. findAll: Debe listar todos los pedidos de clientes', async () => {
    const mockOrders = [
      { shortId: '9845', clientName: 'Marcela Gómez', design: 'Anillo Oro' },
    ];
    prismaMock.clientOrder.findMany.mockResolvedValue(mockOrders);

    const result = await service.findAll();

    expect(prismaMock.clientOrder.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].clientName).toBe('Marcela Gómez');
  });

  it('2. create: Debe generar una nueva orden de cliente con shortId de 4 dígitos y estado inicial En Espera', async () => {
    prismaMock.clientOrder.create.mockImplementation(({ data }) => ({
      ...data,
      id: 'id_db',
    }));

    const newOrder = await service.create(
      'Carlos Ruiz',
      'Dije Personalizado',
      5.2,
      'carlos@example.com',
    );

    expect(prismaMock.clientOrder.create).toHaveBeenCalled();
    const createData = prismaMock.clientOrder.create.mock.calls[0][0].data;
    expect(createData.shortId).toMatch(/^\d{4}$/);
    expect(createData.status).toBe('En Espera');
    expect(createData.stepIndex).toBe(0);
    expect(newOrder.clientName).toBe('Carlos Ruiz');
  });

  it('3. create: Debe enviar notificación al cliente vía WhatsApp cuando se especifica número de teléfono', async () => {
    prismaMock.clientOrder.create.mockImplementation(({ data }) => ({
      ...data,
    }));

    await service.create(
      'Laura',
      'Anillo Zafiro',
      4.0,
      'laura@example.com',
      '+573009998877',
    );

    expect(notificationsServiceMock.notifyClient).toHaveBeenCalledWith(
      '+573009998877',
      'Laura',
      expect.any(String),
    );
  });

  it('4. updateStatus: Debe actualizar el estado y el paso del proceso (stepIndex)', async () => {
    const updated = { shortId: '4312', status: 'En Proceso', stepIndex: 2 };
    prismaMock.clientOrder.update.mockResolvedValue(updated);

    const res = await service.updateStatus('4312', 'En Proceso', 2);

    expect(prismaMock.clientOrder.update).toHaveBeenCalledWith({
      where: { shortId: '4312' },
      data: { status: 'En Proceso', stepIndex: 2 },
    });
    expect(res.stepIndex).toBe(2);
  });
});
