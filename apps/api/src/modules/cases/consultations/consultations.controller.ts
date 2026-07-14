import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AmendConsultationRequestSchema,
  ConsultationListQuerySchema,
  CreateConsultationRequestSchema,
  DeleteConsultationRequestSchema,
  FinalizeConsultationRequestSchema,
  UpdateConsultationRequestSchema,
  type AmendConsultationRequest,
  type ConsultationListQuery,
  type CreateConsultationRequest,
  type DeleteConsultationRequest,
  type FinalizeConsultationRequest,
  type UpdateConsultationRequest,
} from '@nuri/contracts';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
import { ConsultationsService } from './consultations.service';

@Controller('cases/:caseId/consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
  ) {}

  @Post()
  create(
    @Param('caseId') caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateConsultationRequestSchema))
    body: CreateConsultationRequest,
  ) {
    return this.consultationsService.create(caseId, user.userId, body);
  }

  @Get()
  findMany(
    @Param('caseId') caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(ConsultationListQuerySchema))
    query: ConsultationListQuery,
  ) {
    return this.consultationsService.findMany(caseId, user.userId, query);
  }

  @Get(':consultationId')
  findOne(
    @Param('caseId') caseId: string,
    @Param('consultationId') consultationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consultationsService.findOne(
      caseId,
      consultationId,
      user.userId,
    );
  }

  @Patch(':consultationId')
  updateDraft(
    @Param('caseId') caseId: string,
    @Param('consultationId') consultationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateConsultationRequestSchema))
    body: UpdateConsultationRequest,
  ) {
    return this.consultationsService.updateDraft(
      caseId,
      consultationId,
      user.userId,
      body,
    );
  }

  @Post(':consultationId/finalize')
  finalize(
    @Param('caseId') caseId: string,
    @Param('consultationId') consultationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(FinalizeConsultationRequestSchema))
    body: FinalizeConsultationRequest,
  ) {
    return this.consultationsService.finalize(
      caseId,
      consultationId,
      user.userId,
      body.version,
    );
  }

  @Post(':consultationId/amendments')
  amend(
    @Param('caseId') caseId: string,
    @Param('consultationId') consultationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(AmendConsultationRequestSchema))
    body: AmendConsultationRequest,
  ) {
    return this.consultationsService.amend(
      caseId,
      consultationId,
      user.userId,
      body,
    );
  }

  @Delete(':consultationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('caseId') caseId: string,
    @Param('consultationId') consultationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(DeleteConsultationRequestSchema))
    body: DeleteConsultationRequest,
  ) {
    await this.consultationsService.softDelete(
      caseId,
      consultationId,
      user.userId,
      body.version,
    );
  }
}
