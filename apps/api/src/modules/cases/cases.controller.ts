import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateClientRequestSchema, CreateCounselingRecordRequestSchema } from '@nuri/contracts';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('clients')
  listClients() {
    return this.casesService.listClients();
  }

  @Get('clients/:clientId')
  getClient(@Param('clientId') clientId: string) {
    return this.casesService.getClient(clientId);
  }

  @Post('clients')
  createClient(@Body() body: unknown) {
    const parsed = CreateClientRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.casesService.createClient(parsed.data);
  }

  @Get('clients/:clientId/records')
  listRecords(@Param('clientId') clientId: string) {
    return this.casesService.listRecords(clientId);
  }

  @Post('clients/:clientId/records')
  createRecord(@Param('clientId') clientId: string, @Body() body: unknown) {
    const parsed = CreateCounselingRecordRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.casesService.createRecord(clientId, parsed.data);
  }
}
