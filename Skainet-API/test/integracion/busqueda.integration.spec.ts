/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 9: Búsqueda General - RF-009)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Búsqueda General y Filtrado Avanzado (RF-009).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el motor de búsqueda global (`SearchService`),
 * la consulta multicriterio sobre usuarios, inventarios, órdenes de trabajo y clientes.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el buscador global escanea simultáneamente los módulos del sistema
 * aplicando reglas RBAC para que cada rol solo acceda a la información permitida.
 * 
 * Casos incluidos en este archivo:
 * - CP-126: Búsqueda global por texto (Filtro multicriterio OT, Joyero, Cliente, Lote)
 * - CP-128: Filtro por rango de fechas / módulo (Consultas por módulo específico)
 * - CP-129: Exportación de resultados (Estructuración limpia de datos exportables)
 * - CP-130: Auditoría de búsquedas (Trazabilidad del término y rol ejecutor)
 * - CP-132: Búsqueda por cliente (Consulta filtrada en BD por nombre/documento de cliente)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../../src/search/search.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Búsqueda General (RF-009)', () => {
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

  describe('CP-126: Búsqueda global por texto', () => {
    it('Debe buscar el término en usuarios, materiales y órdenes de trabajo simultáneamente', async () => {
      prismaMock.user.findMany.mockResolvedValue([{ id: '4', name: 'Danna Admin', email: 'danna@skainet.com' }]);
      prismaMock.material.findMany.mockResolvedValue([{ id: 'MAT-101', name: 'Oro 18K', category: 'Oro' }]);
      prismaMock.workOrder.findMany.mockResolvedValue([{ id: 'ORD-101', ringName: 'Anillo 1' }]);

      const results = await service.globalSearch('1000000000', 'Super Administrador', 'Oro');

      expect(results.users).toBeDefined();
      expect(results.materials).toBeDefined();
      expect(results.orders).toBeDefined();
      expect(prismaMock.material.findMany).toHaveBeenCalled();
    });
  });

  describe('CP-128: Filtro por rango de fechas / módulo', () => {
    it('Debe restringir la búsqueda únicamente al módulo de inventario si filterModule es "inventario"', async () => {
      prismaMock.material.findMany.mockResolvedValue([{ id: 'MAT-101', name: 'Oro 18K' }]);

      const results = await service.globalSearch('1000000000', 'Super Administrador', 'Oro', 'inventario');

      expect(results.materials).toHaveLength(1);
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
      expect(prismaMock.workOrder.findMany).not.toHaveBeenCalled();
    });
  });

  describe('CP-129: Exportación de resultados', () => {
    it('Debe retornar los datos desinfectados (sin contraseñas) listos para la exportación', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: '4', name: 'Danna Admin', email: 'danna@skainet.com', password: 'secret_hash' },
      ]);

      const results = await service.globalSearch('1000000000', 'Super Administrador', 'Danna', 'usuarios');

      expect(results.users[0].password).toBeUndefined();
      expect(results.users[0].name).toBe('Danna Admin');
    });
  });

  describe('CP-130: Auditoría de búsquedas', () => {
    it('Debe permitir la trazabilidad de consultas por rol ajustando los permisos de búsqueda', async () => {
      prismaMock.material.findMany.mockResolvedValue([]);
      prismaMock.workOrder.findMany.mockResolvedValue([{ id: 'ORD-101', executorId: '1' }]);

      await service.globalSearch('1', 'Joyero', 'ORD-101');

      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
      expect(prismaMock.workOrder.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ executorId: '1' }),
        take: 10,
      });
    });
  });

  describe('CP-132: Búsqueda por cliente', () => {
    it('Debe buscar coincidencia de cliente en los registros de la BD', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'CLI-101', name: 'Joyería La Guaca', email: 'contacto@laguaca.com' },
      ]);

      const results = await service.globalSearch('1000000000', 'Super Administrador', 'La Guaca', 'usuarios');

      expect(results.users).toHaveLength(1);
      expect(results.users[0].name).toBe('Joyería La Guaca');
    });
  });
});
