import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateClientRequest, CreateCounselingRecordRequest } from '@nuri/contracts';
import { RiskLevel, SummaryStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const compact = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item ?? undefined]));

const serializeClient = (client: Record<string, unknown>) => compact({
  ...client,
  birthDate: client.birthDate instanceof Date ? client.birthDate.toISOString().slice(0, 10) : client.birthDate,
  familyBirthDate: client.familyBirthDate instanceof Date ? client.familyBirthDate.toISOString().slice(0, 10) : client.familyBirthDate,
  createdAt: client.createdAt instanceof Date ? client.createdAt.toISOString() : client.createdAt,
  updatedAt: undefined,
});

const serializeRecord = (record: Record<string, unknown>) => compact({
  ...record,
  sessionDate: record.sessionDate instanceof Date ? record.sessionDate.toISOString() : record.sessionDate,
  riskLevel: String(record.riskLevel).toLowerCase(),
  summaryStatus: String(record.summaryStatus).toLowerCase().replace('_', '-'),
  createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  updatedAt: undefined,
});

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async listClients() {
    const clients = await this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    return clients.map(serializeClient);
  }

  async getClient(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    return serializeClient(client);
  }

  async createClient(input: CreateClientRequest) {
    const client = await this.prisma.client.create({
      data: {
        ...input,
        birthDate: input.birthDate ? new Date(`${input.birthDate}T00:00:00.000Z`) : undefined,
        familyBirthDate: input.familyBirthDate ? new Date(`${input.familyBirthDate}T00:00:00.000Z`) : undefined,
      },
    });
    return serializeClient(client);
  }

  async listRecords(clientId: string) {
    await this.ensureClient(clientId);
    const records = await this.prisma.counselingRecord.findMany({ where: { clientId }, orderBy: { sessionDate: 'desc' } });
    return records.map(serializeRecord);
  }

  async createRecord(clientId: string, input: CreateCounselingRecordRequest) {
    await this.ensureClient(clientId);
    const record = await this.prisma.counselingRecord.create({
      data: {
        ...input,
        clientId,
        sessionDate: new Date(input.sessionDate),
        riskLevel: input.riskLevel.toUpperCase() as RiskLevel,
        summaryStatus: input.summaryStatus.toUpperCase().replace('-', '_') as SummaryStatus,
      },
    });
    return serializeRecord(record);
  }

  private async ensureClient(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) throw new NotFoundException('Client not found');
  }
}
