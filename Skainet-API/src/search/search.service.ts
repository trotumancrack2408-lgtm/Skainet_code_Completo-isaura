import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(actorId: string, actorRole: string, term: string, filterModule?: string) {
    if (!term || term.trim().length === 0) {
      throw new BadRequestException('Debe ingresar un término de búsqueda.');
    }

    const queryStr = term.trim();
    const results: { users: any[]; materials: any[]; orders: any[] } = {
      users: [],
      materials: [],
      orders: [],
    };

    const searchUsers = !filterModule || filterModule === 'usuarios' || filterModule === 'all';
    const searchMaterials = !filterModule || filterModule === 'inventario' || filterModule === 'all';
    const searchOrders = !filterModule || filterModule === 'ordenes' || filterModule === 'all';

    // 1. Buscar Usuarios (Solo SuperAdmin y Admin)
    if (searchUsers && (actorRole === 'Super Administrador' || actorRole === 'Dueno' || actorRole === 'Administrador')) {
      const users = (await this.prisma.user.findMany({
        where: {
          OR: [
            { id: { contains: queryStr } },
            { name: { contains: queryStr } },
            { email: { contains: queryStr } },
          ],
        },
        take: 10,
      })) || [];
      results.users = users.map(({ password, ...u }: any) => u);
    }

    // 2. Buscar Materiales de Inventario (Todos los roles)
    if (searchMaterials) {
      const materials = (await this.prisma.material.findMany({
        where: {
          OR: [
            { name: { contains: queryStr } },
            { category: { contains: queryStr } },
          ],
        },
        take: 10,
      })) || [];
      results.materials = materials;
    }

    // 3. Buscar Órdenes de Trabajo (Admin ve todas, Joyero solo las asignadas a él)
    if (searchOrders) {
      const orderWhere: any = {
        OR: [
          { id: { contains: queryStr } },
          { ringName: { contains: queryStr } },
        ],
      };

      if (actorRole === 'Joyero') {
        orderWhere.executorId = actorId;
      }

      const orders = (await this.prisma.workOrder.findMany({
        where: orderWhere,
        take: 10,
      })) || [];
      results.orders = orders;
    }

    return results;
  }
}
