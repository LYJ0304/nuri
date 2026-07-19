import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateClientRequestSchema, CreateCounselingRecordRequestSchema } from '@nuri/contracts';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('clients')
  listClients(@CurrentUser() user: AuthenticatedUser) {
    return this.casesService.listClients(user.userId);
  }

  @Get('clients/:clientId')
  getClient(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.getClient(clientId, user.userId);
  }

  @Post('clients')
  createClient(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const parsed = CreateClientRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.casesService.createClient(user.userId, parsed.data);
  }

  @Get('clients/:clientId/records')
  listRecords(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.listRecords(clientId, user.userId);
  }

  @Post('clients/:clientId/records')
  createRecord(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const parsed = CreateCounselingRecordRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.casesService.createRecord(clientId, user.userId, parsed.data);
  }
}
