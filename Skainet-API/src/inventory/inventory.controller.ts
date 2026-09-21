import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Inventario')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('materials')
  @ApiOperation({ summary: 'Listar y filtrar materiales de inventario' })
  async getMaterials(@Query('name') name?: string, @Query('category') category?: string, @Query('status') status?: string) {
    return this.inventoryService.getMaterials({ name, category, status });
  }

  @Post('materials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un material de inventario' })
  async createMaterial(@Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Administrador';
    return this.inventoryService.createMaterial(actorId, actorRole, body);
  }

  @Patch('materials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un material de inventario' })
  async updateMaterial(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Administrador';
    return this.inventoryService.updateMaterial(actorId, actorRole, id, body);
  }

  @Delete('materials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un material de inventario' })
  async deactivateMaterial(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body?.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body?.actorRole || 'Administrador';
    return this.inventoryService.deactivateMaterial(actorId, actorRole, id);
  }

  @Post('entry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar entrada de material al inventario' })
  async registerEntry(@Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Administrador';
    return this.inventoryService.registerEntry(actorId, actorRole, body);
  }

  @Post('exit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar salida de material del inventario' })
  async registerExit(@Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Joyero';
    return this.inventoryService.registerSalida(actorId, actorRole, body);
  }

  @Get('kardex')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar movimientos de inventario en kardex' })
  async getKardex(@Request() req: any, @Query('materialId') materialId?: string, @Query('type') type?: string) {
    const actorId = req.user?.sub || 'SISTEMA';
    const actorRole = req.user?.role || 'Administrador';
    return this.inventoryService.getKardex(actorId, actorRole, { materialId, type });
  }
}
