import { Controller, Get, Patch, Post, Delete, Param, Body, Query, NotFoundException, BadRequestException, UseGuards, Inject, forwardRef, Request } from '@nestjs/common';
import { UsersService, UserStatus } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Get()
  async findAll(@Query('role') role?: string, @Query('accountStatus') accountStatus?: string) {
    return this.usersService.findAll(role, accountStatus);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  @Post('login')
  async login(@Body() body: { id: string; password: string }) {
    return this.authService.login(body.id, body.password);
  }

  @Post('change-password')
  async changePassword(@Body() body: { userId: string; oldPass: string; newPass: string }) {
    return this.usersService.changePassword(body.userId, body.oldPass, body.newPass);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Param('id') id: string, @Request() req: any) {
    const actorId = req.user?.sub || 'SISTEMA';
    const actorRole = req.user?.role || 'Super Administrador';
    return this.usersService.resetPasswordByAdmin(actorId, actorRole, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @Request() req: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Super Administrador';
    return this.usersService.createUser(actorId, actorRole, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Super Administrador';
    return this.usersService.updateUser(actorId, actorRole, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body?.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body?.actorRole || 'Super Administrador';
    return this.usersService.deactivateUser(actorId, actorRole, id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateShiftStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    const user = await this.usersService.updateShiftStatus(id, status);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
