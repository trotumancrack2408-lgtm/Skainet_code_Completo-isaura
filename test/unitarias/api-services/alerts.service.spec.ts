import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from '../../../Skainet-API/src/alerts/alerts.service';
import { PrismaService } from '../../../Skainet-API/src/prisma/prisma.service';
import { NotificationsService } from '../../../Skainet-API/src/notifications/notifications.service';

describe('AlertsService - Pruebas Unitarias', () => {
  let service: AlertsService;
  let prismaMock: any;
  let notificationsServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      alert: {
        count: jest.fn(),
        createMany: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    notificationsServiceMock = {
      notifyAdmins: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('1. createAlert: Debe registrar la alerta en la base de datos y enviar notificación a administradores', async () => {
    const createdAlert = {
      id: 'ALT-999',
      type: 'WEIGHT',
      severity: 'CRITICAL',
      message: 'Pérdida excesiva detectada',
      jewelerName: 'Plata',
      orderId: 'ORD-103',
      timestamp: new Date(),
    };
    prismaMock.alert.create.mockResolvedValue(createdAlert);

    const alert = await service.createAlert({
      type: 'WEIGHT',
      severity: 'CRITICAL',
      message: 'Pérdida excesiva detectada',
      jewelerName: 'Plata',
      orderId: 'ORD-103',
    });

    expect(prismaMock.alert.create).toHaveBeenCalled();
    expect(notificationsServiceMock.notifyAdmins).toHaveBeenCalledWith(
      expect.stringContaining('🚨 ALERTA SKYNET: Pérdida excesiva detectada | Joyero: Plata'),
    );
    expect(alert.id).toBe('ALT-999');
  });

  it('2. findAll: Debe consultar todas las alertas en orden cronológico descendente', async () => {
    const mockAlerts = [
      { id: 'ALT-102', timestamp: new Date('2026-01-02') },
      { id: 'ALT-101', timestamp: new Date('2026-01-01') },
    ];
    prismaMock.alert.findMany.mockResolvedValue(mockAlerts);

    const result = await service.findAll();

    expect(prismaMock.alert.findMany).toHaveBeenCalledWith({
      orderBy: { timestamp: 'desc' },
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('ALT-102');
  });

  it('3. sendNotifications: Debe utilizar el icono adecuado según la severidad de la alerta', async () => {
    prismaMock.alert.create.mockResolvedValue({
      id: 'ALT-100',
      severity: 'WARNING',
      message: 'Tiempo prolongado',
      jewelerName: 'Ramiro',
    });

    await service.createAlert({
      type: 'TIME',
      severity: 'WARNING',
      message: 'Tiempo prolongado',
      jewelerName: 'Ramiro',
    });

    expect(notificationsServiceMock.notifyAdmins).toHaveBeenCalledWith(
      expect.stringContaining('⚠️ ALERTA SKYNET: Tiempo prolongado | Joyero: Ramiro'),
    );
  });
});
