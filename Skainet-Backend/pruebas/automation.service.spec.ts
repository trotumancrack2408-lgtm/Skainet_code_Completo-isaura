import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from '../src/automation/automation.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AutomationService', () => {
  let service: AutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: PrismaService,
          useValue: {
            material: { findMany: jest.fn().mockResolvedValue([]) },
            machine: { findMany: jest.fn().mockResolvedValue([]) },
            tripleWeightLog: { findMany: jest.fn().mockResolvedValue([]) },
            alert: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe reportar estado online del worker', () => {
    const status = service.getStatus();
    expect(status.status).toBe('ONLINE');
    expect(status.port).toBe(3001);
  });
});
