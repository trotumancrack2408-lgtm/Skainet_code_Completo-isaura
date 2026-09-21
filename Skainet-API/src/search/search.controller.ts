import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Buscador')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar información en los módulos permitidos al usuario' })
  async globalSearch(@Request() req: any, @Query('q') queryStr: string, @Query('module') filterModule?: string) {
    const actorId = req.user?.sub || 'SISTEMA';
    const actorRole = req.user?.role || 'Joyero';
    return this.searchService.globalSearch(actorId, actorRole, queryStr, filterModule);
  }
}
