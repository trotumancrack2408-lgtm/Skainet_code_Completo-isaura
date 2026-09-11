import { Test, TestingModule } from '@nestjs/testing';
import { RecoveryService } from '../../src/recovery/recovery.service';

describe('RecoveryService - Pruebas Unitarias', () => {
  let service: RecoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecoveryService],
    }).compile();

    service = module.get<RecoveryService>(RecoveryService);
  });

  it('1. getStats: Debe retornar las estadísticas iniciales en cero y sin historial', () => {
    const stats = service.getStats();

    expect(stats.totalWasteAccumulated).toBe(0);
    expect(stats.estimatedPureGoldInWaste).toBe(0);
    expect(stats.history).toEqual([]);
  });

  it('2. addWaste: Debe acumular residuo y agregar registro de tipo ENTRY al historial', () => {
    service.addWaste(5.5, 'ORD-101');
    service.addWaste(2.3, 'ORD-102');

    const stats = service.getStats();

    expect(stats.totalWasteAccumulated).toBe(7.8);
    expect(stats.history).toHaveLength(2);
    expect(stats.history[0]).toMatchObject({
      type: 'ENTRY',
      amount: 5.5,
      orderId: 'ORD-101',
    });
  });

  it('3. refineResidues: Debe calcular la eficiencia de refinación y reducir el residuo acumulado', () => {
    service.addWaste(10.0, 'ORD-101');

    // Refinamos 6.0g de residuo obteniendo 4.8g de oro puro (eficiencia 80%)
    const refiningLog = service.refineResidues(6.0, 4.8);

    expect(refiningLog.type).toBe('REFINING');
    expect(refiningLog.efficiency).toBe(80);
    expect(service.getStats().totalWasteAccumulated).toBe(4.0);
    expect(service.getStats().history).toHaveLength(2);
  });

  it('4. refineResidues: Debe lanzar error si se intenta procesar más residuo del acumulado', () => {
    service.addWaste(3.0, 'ORD-101');

    expect(() => {
      service.refineResidues(5.0, 4.0);
    }).toThrow('No puedes fundir más residuos de los que tienes registrados');
  });

  it('5. Debe mantener consistencia del balance acumulado tras múltiples entradas y refinaciones', () => {
    service.addWaste(10, 'ORD-1');
    service.addWaste(15, 'ORD-2'); // Total 25
    service.refineResidues(20, 18); // Restan 5
    service.addWaste(8, 'ORD-3'); // Total 13

    expect(service.getStats().totalWasteAccumulated).toBe(13);
    expect(service.getStats().history).toHaveLength(4);
  });
});
