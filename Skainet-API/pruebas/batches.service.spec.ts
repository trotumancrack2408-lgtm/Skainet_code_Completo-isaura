import { Test, TestingModule } from '@nestjs/testing';
import { BatchesService } from '../src/batches/batches.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('BatchesService - Pruebas Unitarias', () => {
  let service: BatchesService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      batch: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      ring: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BatchesService>(BatchesService);
  });

  it('1. create: Debe crear un nuevo lote con el número de anillos especificado y PINs aleatorios', async () => {
    prismaMock.batch.create.mockImplementation(({ data }) => ({
      ...data,
      createdAt: new Date(),
    }));

    const result = await service.create(200.0, 195.0, 3);

    expect(prismaMock.batch.create).toHaveBeenCalled();
    const createArgs = prismaMock.batch.create.mock.calls[0][0];
    expect(createArgs.data.entryWeight).toBe(200.0);
    expect(createArgs.data.ringsCount).toBe(3);
    expect(createArgs.data.rings.create).toHaveLength(3);
    expect(createArgs.data.rings.create[0].status).toBe('PENDING');
    expect(createArgs.data.rings.create[0].securePin).toBeDefined();
  });

  it('2. findAll: Debe listar todos los lotes de piezas incluyendo sus anillos', async () => {
    const mockBatches = [
      { id: 'B-101', entryWeight: 250, rings: [{ id: 'B-101-R1', name: 'Anillo 1' }] },
    ];
    prismaMock.batch.findMany.mockResolvedValue(mockBatches);

    const result = await service.findAll();

    expect(prismaMock.batch.findMany).toHaveBeenCalledWith({ include: { rings: true } });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('B-101');
  });

  it('3. findPendingRings: Debe retornar únicamente los anillos en estado PENDING', async () => {
    const pendingRings = [
      { id: 'B-102-R3', name: 'Anillo 3', status: 'PENDING', securePin: '8888' },
    ];
    prismaMock.ring.findMany.mockResolvedValue(pendingRings);

    const res = await service.findPendingRings();

    expect(prismaMock.ring.findMany).toHaveBeenCalledWith({ where: { status: 'PENDING' } });
    expect(res).toHaveLength(1);
    expect(res[0].status).toBe('PENDING');
  });

  it('4. getRingById: Debe buscar y retornar la información de un anillo por su ID', async () => {
    const mockRing = { id: 'B-101-R1', name: 'Anillo 1', status: 'COMPLETED' };
    prismaMock.ring.findUnique.mockResolvedValue(mockRing);

    const ring = await service.getRingById('B-101-R1');

    expect(prismaMock.ring.findUnique).toHaveBeenCalledWith({ where: { id: 'B-101-R1' } });
    expect(ring).toEqual(mockRing);
  });

  it('5. updateRingStatus: Debe actualizar el estado y opcionalmente la clave secreta PIN', async () => {
    const updatedRing = { id: 'B-101-R1', status: 'ASSIGNED', securePin: '9999' };
    prismaMock.ring.update.mockResolvedValue(updatedRing);

    const res = await service.updateRingStatus('B-101-R1', 'ASSIGNED', '9999');

    expect(prismaMock.ring.update).toHaveBeenCalledWith({
      where: { id: 'B-101-R1' },
      data: { status: 'ASSIGNED', securePin: '9999' },
    });
    expect(res).toEqual(updatedRing);
  });
});
