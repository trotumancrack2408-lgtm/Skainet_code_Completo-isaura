import { Test, TestingModule } from '@nestjs/testing';
import { BatchesService } from './batches.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BatchesService', () => {
  let service: BatchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        {
          provide: PrismaService,
          useValue: {
            batch: { count: jest.fn(), findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<BatchesService>(BatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
