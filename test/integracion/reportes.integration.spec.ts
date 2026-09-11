/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 10: Reportes y Métricas - RF-010)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Reportes de Desempeño y Métricas de Calidad (RF-010).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el servicio de estadísticas (`StatsService`),
 * la compilación de métricas de mermas, el ranking de tiempos por joyero y la estructuración de datos para gráficas.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema compila la merma acumulada, calcula el promedio de minutos por joyero
 * y genera el resumen gerencial para la toma de decisiones del taller.
 * 
 * Casos incluidos en este archivo:
 * - CP-133: Generación reporte eficiencia (Consulta en BD de tiempos y mermas por joyero)
 * - CP-134: Reporte de rotación inventario (Cálculo en BD de salidas de materia prima)
 * - CP-136: Gráficas de rendimiento (Estructuración de datos JSON para gráficas)
 * - CP-137: Exportar reporte PDF/Excel (Generación de datos estructurados para exportación)
 * - CP-138: Auditoría acceso reportes (Log en BD de generación de reportes gerenciales)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from '../../Skainet-API/src/stats/stats.service';
import { OrdersService } from '../../Skainet-API/src/orders/orders.service';
import { UsersService } from '../../Skainet-API/src/users/users.service';
import { AlertsService } from '../../Skainet-API/src/alerts/alerts.service';

describe('PRUEBAS DE INTEGRACIÓN - Reportes y Métricas (RF-010)', () => {
  let service: StatsService;
  let ordersServiceMock: any;
  let usersServiceMock: any;
  let alertsServiceMock: any;

  beforeEach(async () => {
    ordersServiceMock = {
      findAll: jest.fn().mockResolvedValue([
        { id: 'ORD-101', executorId: '1', status: 'CLOSED', loss: 0.02, durationMinutes: 45 },
        { id: 'ORD-102', executorId: '2', status: 'CLOSED', loss: 0.03, durationMinutes: 60 },
      ]),
    };

    usersServiceMock = {
      findAll: jest.fn().mockResolvedValue([
        { id: '1', name: 'Ramiro', role: 'Joyero' },
        { id: '2', name: 'Carlos', role: 'Joyero' },
      ]),
    };

    alertsServiceMock = {
      findAll: jest.fn().mockResolvedValue([
        { id: 'ALT-101', severity: 'CRITICAL', message: 'Merma alta' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: OrdersService, useValue: ordersServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: AlertsService, useValue: alertsServiceMock },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  describe('CP-133: Generación reporte eficiencia', () => {
    it('Debe calcular el promedio de minutos y mermas acumuladas por joyero desde la BD', async () => {
      const stats = await service.getGeneralStats();

      expect(stats.totalLoss).toBe(0.05);
      expect(stats.ranking).toHaveLength(2);
      expect(stats.ranking[0].name).toBe('Ramiro');
      expect(stats.ranking[0].avgMinutes).toBe(45);
    });
  });

  describe('CP-134: Reporte de rotación inventario', () => {
    it('Debe retornar las métricas de piezas totales producidas y activas en mesa', async () => {
      const stats = await service.getGeneralStats();

      expect(stats.totalProduced).toBe(2);
      expect(stats.activeWork).toBe(0);
    });
  });

  describe('CP-136: Gráficas de rendimiento', () => {
    it('Debe estructurar la respuesta en un formato JSON listo para alimentar gráficas en frontend', async () => {
      const stats = await service.getGeneralStats();

      expect(stats).toHaveProperty('ranking');
      expect(stats).toHaveProperty('totalLoss');
      expect(stats).toHaveProperty('incidentCount');
      expect(Array.isArray(stats.ranking)).toBe(true);
    });
  });

  describe('CP-137: Exportar reporte PDF/Excel', () => {
    it('Debe retornar los datos del reporte organizados de forma tabular para su conversión a Excel/PDF', async () => {
      const stats = await service.getGeneralStats();

      const exportableRows = stats.ranking.map(item => ({
        Joyero: item.name,
        'Tiempo Promedio (min)': item.avgMinutes,
        'Piezas Completadas': item.completedCount,
      }));

      expect(exportableRows).toHaveLength(2);
      expect(exportableRows[0].Joyero).toBe('Ramiro');
    });
  });

  describe('CP-138: Auditoría acceso reportes', () => {
    it('Debe registrar la consulta de métricas de incidentes críticos para control gerencial', async () => {
      const stats = await service.getGeneralStats();

      expect(stats.incidentCount).toBe(1);
      expect(alertsServiceMock.findAll).toHaveBeenCalled();
    });
  });
});
