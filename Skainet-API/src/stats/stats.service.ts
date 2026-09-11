import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly alertsService: AlertsService,
  ) {}

  async getGeneralStats() {
    const orders = await this.ordersService.findAll();
    const closedOrders = orders.filter(o => o.status === 'CLOSED');
    
    // 1. Merma Acumulada
    const totalLoss = closedOrders.reduce((sum, o) => sum + (o.loss || 0), 0);
    
    // 2. Ranking de Productividad (Promedio minutos por pieza por joyero)
    const allUsers = await this.usersService.findAll();
    const joyeros = allUsers.filter(u => u.role === 'Joyero');
    const ranking = joyeros.map(j => {
      const jOrders = closedOrders.filter(o => o.executorId === j.id);
      const avgMinutes = jOrders.length > 0 
        ? jOrders.reduce((sum, o) => sum + (o.durationMinutes || 0), 0) / jOrders.length 
        : 0;
      return {
        name: j.name,
        avgMinutes: Number(avgMinutes.toFixed(1)),
        completedCount: jOrders.length
      };
    }).sort((a,b) => (a.avgMinutes || 999) - (b.avgMinutes || 999));

    // 3. Balance de Seguridad
    const alerts = await this.alertsService.findAll();
    const incidentCount = alerts.filter(a => a.severity === 'CRITICAL').length;

    return {
      totalLoss: Number(totalLoss.toFixed(3)),
      ranking,
      incidentCount,
      totalProduced: closedOrders.length,
      activeWork: orders.filter(o => o.status === 'OPEN').length
    };
  }
}

