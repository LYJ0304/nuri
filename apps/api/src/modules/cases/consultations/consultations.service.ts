import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AmendConsultationRequest,
  ConsultationContent,
  ConsultationListQuery,
  CreateConsultationRequest,
  UpdateConsultationRequest,
} from '@nuri/contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

function asJson(content: ConsultationContent): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(content)) as Prisma.InputJsonObject;
}

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  private async requireOwnedCase(
    caseId: string,
    counselorId: string,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    const targetCase = await client.case.findFirst({
      where: { id: caseId, counselorId },
      select: { id: true },
    });

    if (!targetCase) {
      throw new NotFoundException('Case not found');
    }

    return targetCase;
  }

  async create(
    caseId: string,
    counselorId: string,
    dto: CreateConsultationRequest,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireOwnedCase(caseId, counselorId, tx);

      const consultation = await tx.consultation.create({
        data: {
          caseId,
          counselorId,
          occurredAt: new Date(dto.occurredAt),
          durationMinutes: dto.durationMinutes,
          channel: dto.channel,
          subject: dto.subject,
          summary: dto.summary,
          revisions: {
            create: {
              revision: 1,
              content: asJson(dto.content),
              createdById: counselorId,
            },
          },
        },
        include: {
          revisions: true,
        },
      });

      await this.auditLogs.write(
        {
          actorId: counselorId,
          action: 'CONSULTATION_CREATED',
          resourceType: 'CONSULTATION',
          resourceId: consultation.id,
        },
        tx,
      );

      return consultation;
    });
  }

  async findMany(
    caseId: string,
    counselorId: string,
    query: ConsultationListQuery,
  ) {
    await this.requireOwnedCase(caseId, counselorId);

    const rows = await this.prisma.consultation.findMany({
      where: {
        caseId,
        counselorId,
        deletedAt: null,
        status: query.status,
      },
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        occurredAt: true,
        durationMinutes: true,
        channel: true,
        status: true,
        subject: true,
        summary: true,
        version: true,
        finalizedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasNextPage = rows.length > query.limit;
    const items = hasNextPage ? rows.slice(0, query.limit) : rows;

    return {
      items,
      nextCursor: hasNextPage ? items.at(-1)?.id ?? null : null,
    };
  }

  async findOne(
    caseId: string,
    consultationId: string,
    counselorId: string,
  ) {
    const consultation = await this.prisma.consultation.findFirst({
      where: {
        id: consultationId,
        caseId,
        counselorId,
        deletedAt: null,
        case: { counselorId },
      },
      include: {
        revisions: {
          orderBy: { revision: 'desc' },
          take: 1,
        },
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async updateDraft(
    caseId: string,
    consultationId: string,
    counselorId: string,
    dto: UpdateConsultationRequest,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireOwnedCase(caseId, counselorId, tx);

      const result = await tx.consultation.updateMany({
        where: {
          id: consultationId,
          caseId,
          counselorId,
          version: dto.version,
          status: 'DRAFT',
          deletedAt: null,
        },
        data: {
          occurredAt: dto.occurredAt
            ? new Date(dto.occurredAt)
            : undefined,
          durationMinutes: dto.durationMinutes,
          channel: dto.channel,
          subject: dto.subject,
          summary: dto.summary,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Consultation is not an editable draft or its version has changed',
        );
      }

      if (dto.content) {
        await tx.consultationRevision.create({
          data: {
            consultationId,
            revision: dto.version + 1,
            content: asJson(dto.content),
            createdById: counselorId,
          },
        });
      }

      await this.auditLogs.write(
        {
          actorId: counselorId,
          action: 'CONSULTATION_UPDATED',
          resourceType: 'CONSULTATION',
          resourceId: consultationId,
          metadata: {
            fromVersion: dto.version,
            toVersion: dto.version + 1,
          },
        },
        tx,
      );

      return tx.consultation.findUniqueOrThrow({
        where: { id: consultationId },
        include: {
          revisions: {
            orderBy: { revision: 'desc' },
            take: 1,
          },
        },
      });
    });
  }

  async finalize(
    caseId: string,
    consultationId: string,
    counselorId: string,
    version: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireOwnedCase(caseId, counselorId, tx);

      const result = await tx.consultation.updateMany({
        where: {
          id: consultationId,
          caseId,
          counselorId,
          version,
          status: 'DRAFT',
          deletedAt: null,
        },
        data: {
          status: 'FINALIZED',
          finalizedAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Consultation cannot be finalized or its version has changed',
        );
      }

      await this.auditLogs.write(
        {
          actorId: counselorId,
          action: 'CONSULTATION_FINALIZED',
          resourceType: 'CONSULTATION',
          resourceId: consultationId,
        },
        tx,
      );

      return tx.consultation.findUniqueOrThrow({
        where: { id: consultationId },
      });
    });
  }

  async amend(
    caseId: string,
    consultationId: string,
    counselorId: string,
    dto: AmendConsultationRequest,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireOwnedCase(caseId, counselorId, tx);

      const result = await tx.consultation.updateMany({
        where: {
          id: consultationId,
          caseId,
          counselorId,
          version: dto.version,
          status: { in: ['FINALIZED', 'AMENDED'] },
          deletedAt: null,
        },
        data: {
          status: 'AMENDED',
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Consultation cannot be amended or its version has changed',
        );
      }

      const revision = await tx.consultationRevision.create({
        data: {
          consultationId,
          revision: dto.version + 1,
          content: asJson(dto.content),
          changeReason: dto.changeReason,
          createdById: counselorId,
        },
      });

      await this.auditLogs.write(
        {
          actorId: counselorId,
          action: 'CONSULTATION_AMENDED',
          resourceType: 'CONSULTATION',
          resourceId: consultationId,
          metadata: {
            revision: revision.revision,
            changeReason: dto.changeReason,
          },
        },
        tx,
      );

      return revision;
    });
  }

  async softDelete(
    caseId: string,
    consultationId: string,
    counselorId: string,
    version: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireOwnedCase(caseId, counselorId, tx);

      const result = await tx.consultation.updateMany({
        where: {
          id: consultationId,
          caseId,
          counselorId,
          version,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Consultation was already deleted or its version has changed',
        );
      }

      await this.auditLogs.write(
        {
          actorId: counselorId,
          action: 'CONSULTATION_DELETED',
          resourceType: 'CONSULTATION',
          resourceId: consultationId,
        },
        tx,
      );
    });
  }
}
