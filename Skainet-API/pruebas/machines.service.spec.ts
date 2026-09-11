import { Test, TestingModule } from '@nestjs/testing';
import { MachinesService } from '../src/machines/machines.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AlertsService } from '../src/alerts/alerts.service';

describe('MachinesService - Pruebas Unitarias', () => {
  let service: MachinesService;
  let prismaMock: any;
  let alertsServiceMock: any;

  const mockMachine = {
    id: 'M-01',
    name: 'Láser de Marcado Fibra',
    type: 'LASER',
    status: 'OPERATIONAL',
    cycleCount: 499,
    maintenanceThreshold: 500,
    lastMaintenance: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      machine: {
        count: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    alertsServiceMock = {
      createAlert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachinesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AlertsService, useValue: alertsServiceMock },
      ],
    }).compile();

    service = module.get<MachinesService>(MachinesService);
  });

  it('1. findAll: Debe retornar la lista de todas las máquinas registradas', async () => {
    prismaMock.machine.findMany.mockResolvedValue([mockMachine]);

    const result = await service.findAll();

    expect(prismaMock.machine.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('M-01');
  });

  it('2. incrementCycles: Debe incrementar los ciclos y retornar null si la máquina no existe', async () => {
    prismaMock.machine.findUnique.mockResolvedValue(null);
    const resNull = await service.incrementCycles('M-INEXISTENTE');
    expect(resNull).toBeNull();

    prismaMock.machine.findUnique.mockResolvedValue({ ...mockMachine, cycleCount: 10 });
    prismaMock.machine.update.mockResolvedValue({ ...mockMachine, cycleCount: 11 });

    const updated = await service.incrementCycles('M-01');
    expect(prismaMock.machine.update).toHaveBeenCalledWith({
      where: { id: 'M-01' },
      data: { cycleCount: 11 },
    });
    expect(updated.cycleCount).toBe(11);
  });

  it('3. incrementCycles: Debe disparar una alerta de mantenimiento al alcanzar o superar el umbral', async () => {
    prismaMock.machine.findUnique.mockResolvedValue({ ...mockMachine, cycleCount: 499 });
    prismaMock.machine.update.mockResolvedValue({ ...mockMachine, cycleCount: 500 });

    await service.incrementCycles('M-01');

    expect(alertsServiceMock.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SECURITY',
        severity: 'WARNING',
        message: expect.stringContaining('MANTENIMIENTO REQUERIDO'),
      }),
    );
  });

  it('4. reportIssue: Debe colocar la máquina en estado DOWN y generar alerta de fallo crítico', async () => {
    prismaMock.machine.findUnique.mockResolvedValue(mockMachine);
    prismaMock.machine.update.mockResolvedValue({ ...mockMachine, status: 'DOWN' });

    const result = await service.reportIssue('M-01', 'Fallo en lente focal');

    expect(prismaMock.machine.update).toHaveBeenCalledWith({
      where: { id: 'M-01' },
      data: { status: 'DOWN' },
    });
    expect(alertsServiceMock.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SECURITY',
        severity: 'CRITICAL',
        message: expect.stringContaining('FALLO DE MAQUINARIA'),
      }),
    );
    expect(result.status).toBe('DOWN');
  });

  it('5. setOperational: Debe reestablecer el estado a OPERATIONAL y reiniciar el contador de ciclos a 0', async () => {
    prismaMock.machine.update.mockResolvedValue({
      ...mockMachine,
      status: 'OPERATIONAL',
      cycleCount: 0,
    });

    const result = await service.setOperational('M-01');

    expect(prismaMock.machine.update).toHaveBeenCalledWith({
      where: { id: 'M-01' },
      data: {
        status: 'OPERATIONAL',
        cycleCount: 0,
        lastMaintenance: expect.any(Date),
      },
    });
    expect(result.cycleCount).toBe(0);
    expect(result.status).toBe('OPERATIONAL');
  });
});
