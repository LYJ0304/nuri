import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { ConsultationsController } from './consultations/consultations.controller';
import { ConsultationsService } from './consultations/consultations.service';

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [CasesController, ConsultationsController],
  providers: [CasesService, ConsultationsService],
})
export class CasesModule {}
