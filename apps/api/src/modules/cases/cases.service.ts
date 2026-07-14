import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CaseListQuery,
  CreateCaseRequest,
  UpdateCaseRequest,
} from '@nuri/contracts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  create(counselorId: string, dto: CreateCaseRequest) {
    return this.prisma.case.create({
      data: {
        counselorId,
        title: dto.title,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        clientBirthDate: dto.clientBirthDate
          ? new Date(dto.clientBirthDate)
          : null,
        clientAddress: dto.clientAddress,
        clientMemo: dto.clientMemo,
      },
    });
  }

  async findMany(counselorId: string, query: CaseListQuery) {
    const rows = await this.prisma.case.findMany({
      where: {
        counselorId,
        status: query.status,
      },
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        clientName: true,
        clientPhone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            consultations: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    const hasNextPage = rows.length > query.limit;
    const items = hasNextPage ? rows.slice(0, query.limit) : rows;

    return {
      items,
      nextCursor: hasNextPage ? items.at(-1)?.id ?? null : null,
    };
  }

  async findOne(caseId: string, counselorId: string) {
    const targetCase = await this.prisma.case.findFirst({
      where: { id: caseId, counselorId },
      include: {
        _count: {
          select: {
            consultations: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!targetCase) {
      throw new NotFoundException('Case not found');
    }

    return targetCase;
  }

  async update(
    caseId: string,
    counselorId: string,
    dto: UpdateCaseRequest,
  ) {
    await this.findOne(caseId, counselorId);

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        title: dto.title,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        clientBirthDate:
          dto.clientBirthDate === undefined
            ? undefined
            : dto.clientBirthDate
              ? new Date(dto.clientBirthDate)
              : null,
        clientAddress: dto.clientAddress,
        clientMemo: dto.clientMemo,
      },
    });
  }
}
