import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SearchService } from '../../src/search/search.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('SearchService - Pruebas Unitarias', () => {
  let service: SearchService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: { findMany: jest.fn() },
      material: { findMany: jest.fn() },
      workOrder: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('1. Debe realizar búsqueda exitosa por código único de OT (CP-057)', async () => {
    prismaMock.workOrder.findMany.mockResolvedValue([
      { id: 'ORD-555', ringName: 'Anillo Diamante', executorId: 'joy-1' },
    ]);
    prismaMock.material.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await service.globalSearch('admin-1', 'Administrador', 'ORD-555');

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].id).toBe('ORD-555');
  });

  it('2. Debe realizar búsqueda por coincidencia parcial en nombre de material (CP-058)', async () => {
    prismaMock.material.findMany.mockResolvedValue([
      { id: 'm-1', name: 'Oro de 18 Kilates', category: 'Metal' },
    ]);
    prismaMock.workOrder.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await service.globalSearch('joy-1', 'Joyero', 'Oro');

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].name).toContain('Oro');
  });

  it('3. Joyero NO debe acceder a información de usuarios fuera de su alcance (CP-059)', async () => {
    prismaMock.material.findMany.mockResolvedValue([]);
    prismaMock.workOrder.findMany.mockResolvedValue([]);

    const result = await service.globalSearch('joy-1', 'Joyero', 'Ramiro', 'all');

    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    expect(result.users).toEqual([]);
  });

  it('4. Debe lanzar BadRequestException si el término de búsqueda está vacío', async () => {
    await expect(
      service.globalSearch('admin-1', 'Administrador', '   '),
    ).rejects.toThrow(BadRequestException);
  });
});
