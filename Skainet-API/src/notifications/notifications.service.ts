import { Injectable, Logger } from '@nestjs/common';
import { UsersService, UserRole } from '../users/users.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('WhatsAppNotifier');

  constructor(private readonly usersService: UsersService) {}

  async notifyAdmins(message: string) {
    const users = await this.usersService.findAll();
    const admins = users.filter(u => 
      u.role === UserRole.ADMIN || u.role === UserRole.DUENO
    );

    for (const admin of admins) {
      if (admin.phone) {
        await this.simulateWhatsApp(admin.phone, admin.name, message);
      }
    }
  }

  async notifyClient(phone: string, name: string, orderId: string) {
    const trackingLink = `http://192.168.1.64:5173/track/${orderId.slice(-6)}`;
    const message = `¡Hola ${name}! 💎 Tu pedido en Skynet RV ha sido registrado. Puedes seguir el progreso de tu joya en tiempo real aquí: ${trackingLink}`;
    
    await this.simulateWhatsApp(phone, name, message);
  }

  private async simulateWhatsApp(phone: string, name: string, message: string) {
    // Simulamos un delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.logger.log(`📱 [WHATSAPP SENT] Para: ${name} (${phone}) | Msg: ${message}`);
  }
}
