import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from '../../../Skainet-Backend/src/telemetry/telemetry.service';
import { PrismaService } from '../../../Skainet-Backend/src/prisma/prisma.service';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: { create: jest.fn().mockResolvedValue({}) },
            machine: { findUnique: jest.fn(), update: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe listar dispositivos IoT de taller', () => {
    const devices = service.getConnectedDevices();
    expect(devices.length).toBeGreaterThan(0);
  });
});
