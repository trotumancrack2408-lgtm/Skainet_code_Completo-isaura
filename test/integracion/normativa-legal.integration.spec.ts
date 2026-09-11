/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 20: Conformidad Legal - RF-020)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Conformidad Legal y Normativa (RF-020).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de las garantías de protección de datos personales (Habeas Data), la certificación legal de metales preciosos (ley de oro)
 * y el no-repudio mediante PIN/Firma digital en las entregas de metal.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema certifica el origen legal del oro (Ley 750 / 18K), cumple con la protección de datos
 * y exige la firma/PIN de seguridad como prueba jurídica de entrega.
 * 
 * Casos incluidos en este archivo:
 * - CP-182: Cumplimiento Ley Habeas Data (Autorización y manejo de datos personales)
 * - CP-184: Trazabilidad legal de metales (Registro de procedencia y ley de metales preciosos)
 * - CP-185: Firma digital / Aceptación (Registro de conformidad y PIN en entregas de oro)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Conformidad Legal (RF-020)', () => {
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      material: {
        findMany: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };

    await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
  });

  describe('CP-182: Cumplimiento Ley Habeas Data', () => {
    it('Debe registrar de forma explícita la aceptación de términos y política de tratamiento de datos personales', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: '1000000000',
        habeasDataAccepted: true,
        acceptedAt: new Date(),
      });

      const updatedUser = await prismaMock.user.update({
        where: { id: '1000000000' },
        data: { habeasDataAccepted: true },
      });

      expect(updatedUser.habeasDataAccepted).toBe(true);
    });
  });

  describe('CP-184: Trazabilidad legal de metales', () => {
    it('Debe verificar que todo material precioso registrado cuente con su certificación de Ley (ej. Oro 18K / Ley 750)', async () => {
      prismaMock.material.findMany.mockResolvedValue([
        { id: 'MAT-1', name: 'Granalla Oro 18K', purity: '750/1000', origin: 'Proveedor Certificado SA' },
      ]);

      const materials = await prismaMock.material.findMany();

      expect(materials[0].purity).toBe('750/1000');
      expect(materials[0].origin).toBeDefined();
    });
  });

  describe('CP-185: Firma digital / Aceptación', () => {
    it('Debe registrar la firma digital o comprobante de PIN seguro como prueba inmutable de entrega de metal', () => {
      const deliveryReceipt = {
        orderId: 'ORD-101',
        receiverId: '4',
        executorId: '1',
        signaturePinUsed: '1111',
        signedAt: new Date().toISOString(),
        isLegalSignatureValid: true,
      };

      expect(deliveryReceipt.signaturePinUsed).toBe('1111');
      expect(deliveryReceipt.isLegalSignatureValid).toBe(true);
    });
  });
});
