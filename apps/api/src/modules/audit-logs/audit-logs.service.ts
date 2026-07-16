import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type WriteAuditLogParams = {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  write(
    params: WriteAuditLogParams,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    return client.auditLog.create({ data: params });
  }
}
