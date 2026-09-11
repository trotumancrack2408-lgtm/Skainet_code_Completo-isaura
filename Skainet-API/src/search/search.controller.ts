import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Buscador')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async globalSearch(@Request() req: any, @Query('q') queryStr: string, @Query('module') filterModule?: string) {
    const actorId = req.user?.sub || 'SISTEMA';
    const actorRole = req.user?.role || 'Joyero';
    return this.searchService.globalSearch(actorId, actorRole, queryStr, filterModule);
  }
}
