import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from '../src/stats/stats.service';
import { OrdersService } from '../src/orders/orders.service';
import { UsersService, UserRole } from '../src/users/users.service';
import { AlertsService } from '../src/alerts/alerts.service';

describe('StatsService - Pruebas Unitarias', () => {
  let service: StatsService;
  let ordersServiceMock: any;
  let usersServiceMock: any;
  let alertsServiceMock: any;

  beforeEach(async () => {
    ordersServiceMock = {
      findAll: jest.fn(),
    };
    usersServiceMock = {
      findAll: jest.fn(),
    };
    alertsServiceMock = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: OrdersService, useValue: ordersServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: AlertsService, useValue: alertsServiceMock },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  it('1. getGeneralStats: Debe calcular métricas generales (pérdidas, total producido, trabajos activos e incidentes)', async () => {
    ordersServiceMock.findAll.mockResolvedValue([
      { status: 'CLOSED', loss: 0.05, durationMinutes: 60, executorId: '1' },
      { status: 'CLOSED', loss: 0.10, durationMinutes: 90, executorId: '2' },
      { status: 'OPEN', executorId: '1' },
    ]);

    usersServiceMock.findAll.mockResolvedValue([
      { id: '1', name: 'Ramiro', role: UserRole.JOYERO },
      { id: '2', name: 'Deysi', role: UserRole.JOYERO },
    ]);

    alertsServiceMock.findAll.mockResolvedValue([
      { severity: 'CRITICAL', type: 'WEIGHT' },
      { severity: 'WARNING', type: 'TIME' },
    ]);

    const stats = await service.getGeneralStats();

    expect(stats.totalLoss).toBe(0.15);
    expect(stats.totalProduced).toBe(2);
    expect(stats.activeWork).toBe(1);
    expect(stats.incidentCount).toBe(1);
  });

  it('2. getGeneralStats: Debe retornar cero y colecciones vacías de forma segura cuando no hay datos', async () => {
    ordersServiceMock.findAll.mockResolvedValue([]);
    usersServiceMock.findAll.mockResolvedValue([]);
    alertsServiceMock.findAll.mockResolvedValue([]);

    const stats = await service.getGeneralStats();

    expect(stats.totalLoss).toBe(0);
    expect(stats.ranking).toEqual([]);
    expect(stats.incidentCount).toBe(0);
    expect(stats.totalProduced).toBe(0);
    expect(stats.activeWork).toBe(0);
  });

  it('3. getGeneralStats: Debe ordenar el ranking de joyeros de menor a mayor promedio de minutos por pieza', async () => {
    ordersServiceMock.findAll.mockResolvedValue([
      { status: 'CLOSED', durationMinutes: 100, executorId: '1' }, // Ramiro avg: 100
      { status: 'CLOSED', durationMinutes: 40, executorId: '2' },  // Deysi avg: 40
    ]);

    usersServiceMock.findAll.mockResolvedValue([
      { id: '1', name: 'Ramiro', role: UserRole.JOYERO },
      { id: '2', name: 'Deysi', role: UserRole.JOYERO },
    ]);

    alertsServiceMock.findAll.mockResolvedValue([]);

    const stats = await service.getGeneralStats();

    expect(stats.ranking[0].name).toBe('Deysi');
    expect(stats.ranking[0].avgMinutes).toBe(40);
    expect(stats.ranking[1].name).toBe('Ramiro');
    expect(stats.ranking[1].avgMinutes).toBe(100);
  });
});
