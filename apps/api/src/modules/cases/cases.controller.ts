import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  CaseListQuerySchema,
  CreateCaseRequestSchema,
  UpdateCaseRequestSchema,
  type CaseListQuery,
  type CreateCaseRequest,
  type UpdateCaseRequest,
} from '@nuri/contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import { CasesService } from './cases.service';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateCaseRequestSchema))
    body: CreateCaseRequest,
  ) {
    return this.casesService.create(user.userId, body);
  }

  @Get()
  findMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(CaseListQuerySchema)) query: CaseListQuery,
  ) {
    return this.casesService.findMany(user.userId, query);
  }

  @Get(':caseId')
  findOne(
    @Param('caseId') caseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.casesService.findOne(caseId, user.userId);
  }

  @Patch(':caseId')
  update(
    @Param('caseId') caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateCaseRequestSchema))
    body: UpdateCaseRequest,
  ) {
    return this.casesService.update(caseId, user.userId, body);
  }
}
