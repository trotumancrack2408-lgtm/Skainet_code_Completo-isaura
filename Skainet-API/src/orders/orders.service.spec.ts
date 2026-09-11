import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { BatchesService } from '../batches/batches.service';
import { AlertsService } from '../alerts/alerts.service';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: { workOrder: { count: jest.fn() } } },
        { provide: UsersService, useValue: { findOne: jest.fn() } },
        { provide: BatchesService, useValue: { getRingById: jest.fn() } },
        { provide: AlertsService, useValue: { createAlert: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
