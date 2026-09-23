import { Test, TestingModule } from '@nestjs/testing';
import { BatchesController } from '../../../../Skainet-API/src/batches/batches.controller';
import { BatchesService } from '../../../../Skainet-API/src/batches/batches.service';

describe('BatchesController', () => {
  let controller: BatchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchesController],
      providers: [
        {
          provide: BatchesService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BatchesController>(BatchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
