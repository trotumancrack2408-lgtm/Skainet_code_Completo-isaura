import { Controller, Get, Patch, Post, Delete, Param, Body, Query, NotFoundException, BadRequestException, UseGuards, Inject, forwardRef, Request } from '@nestjs/common';
import { UsersService, UserStatus } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios con filtros opcionales' })
  async findAll(@Query('role') role?: string, @Query('accountStatus') accountStatus?: string) {
    return this.usersService.findAll(role, accountStatus);
  }

  @Get(':id/recovery-questions')
  @ApiOperation({ summary: 'Obtener preguntas de recuperación de un usuario' })
  async recoveryQuestions(@Param('id') id: string) {
    return this.usersService.getRecoveryQuestions(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un usuario por identificación' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuario y obtener token JWT' })
  async login(@Body() body: { id: string; password: string }) {
    return this.authService.login(body.id, body.password);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
  async changePassword(@Body() body: { userId: string; oldPass: string; newPass: string }) {
    return this.usersService.changePassword(body.userId, body.oldPass, body.newPass);
  }

  @Post(':id/recovery')
  @ApiOperation({ summary: 'Recuperar acceso mediante preguntas de seguridad' })
  async recoverPassword(@Param('id') id: string, @Body('answers') answers: string[]) {
    return this.usersService.recoverPassword(id, answers);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restablecer la contraseña de un usuario como administrador' })
  async resetPassword(@Param('id') id: string, @Request() req: any) {
    const actorId = req.user?.sub || 'SISTEMA';
    const actorRole = req.user?.role || 'Super Administrador';
    return this.usersService.resetPasswordByAdmin(actorId, actorRole, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  async create(@Body() body: any, @Request() req: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Super Administrador';
    return this.usersService.createUser(actorId, actorRole, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar los datos de un usuario' })
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Super Administrador';
    return this.usersService.updateUser(actorId, actorRole, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un usuario' })
  async remove(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body?.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body?.actorRole || 'Super Administrador';
    await this.confirmAdministrativeAction(actorId, body?.password);
    return this.usersService.deactivateUser(actorId, actorRole, id);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivar un usuario inactivo' })
  async activate(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body?.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body?.actorRole || 'Super Administrador';
    await this.confirmAdministrativeAction(actorId, body?.password);
    return this.usersService.activateUser(actorId, actorRole, id);
  }

  private async confirmAdministrativeAction(actorId: string, password?: string) {
    if (!password || !(await this.usersService.validatePassword(actorId, password))) {
      throw new BadRequestException('Debe confirmar su contraseña para continuar.');
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado operativo o turno de un usuario' })
  async updateShiftStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    const user = await this.usersService.updateShiftStatus(id, status);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
