import { PrismaClient, RiskLevel, SummaryStatus } from '@prisma/client';

const prisma = new PrismaClient();

const clientId = 'seed-client-kim-minseo';

async function main() {
  await prisma.client.upsert({
    where: { id: clientId },
    update: {},
    create: {
      id: clientId,
      name: '김민서',
      birthDate: new Date('2008-03-18T00:00:00+09:00'),
      gender: 'female',
      occupation: '학생',
      phoneNumber: '010-1234-5678',
      protectionCategory: 'general',
      householdType: 'single-parent',
      housingType: 'apartment',
      housingOwnership: 'monthly-rent',
      familyRelationship: '어머니',
      familyName: '이수진',
      familyOccupation: '회사원',
      familyCohabitation: 'yes',
      familyNotes: '주 양육자',
      createdAt: new Date('2026-06-30T11:00:00+09:00'),
    },
  });

  const records = [
    { id: 'seed-record-kim-minseo-1', title: '초기 상담 기록', sessionDate: '2026-06-30T11:00:00+09:00', sessionNumber: 1, presentingConcern: '결석과 불안감', sessionContent: '최근 반복되는 결석과 불안감을 주호소로 방문함. 현재 어려움과 가족 및 학교 내 지지체계를 확인함.', followUpPlan: '생활 리듬과 불안이 심해지는 시간대를 확인하기' },
    { id: 'seed-record-kim-minseo-2', title: '2차 상담 기록', sessionDate: '2026-07-07T14:00:00+09:00', sessionNumber: 2, presentingConcern: '등교 불안과 수면 문제', sessionContent: '수면 부족과 등교 전 긴장감의 연관성을 탐색하고 취침 전 사용할 수 있는 이완 방법을 함께 연습함.', followUpPlan: '취침 전 호흡 이완을 실천하고 효과를 기록하기' },
    { id: 'seed-record-kim-minseo-3', title: '7월 3주차 정기 상담', sessionDate: '2026-07-14T10:24:00+09:00', sessionNumber: 3, presentingConcern: '수면 패턴과 학교 적응', sessionContent: '최근 수면 시간이 조금씩 안정되고 있으며, 학교생활에서 느끼는 불안도 이전 회기보다 완화되었다고 보고함.', counselorObservation: '이전 회기보다 표정이 편안하고 대화 참여도가 높았음.', intervention: '생활 리듬의 긍정적 변화를 강화하고 불안 상황 기록 방법을 안내함.', followUpPlan: '일주일간 수면 기록과 불안이 높아지는 상황을 함께 기록하기' },
  ];

  for (const record of records) {
    await prisma.counselingRecord.upsert({
      where: { id: record.id },
      update: {},
      create: { ...record, clientId, sessionDate: new Date(record.sessionDate), sessionType: 'individual', riskLevel: RiskLevel.NONE, summaryStatus: SummaryStatus.COMPLETED, createdAt: new Date(record.sessionDate) },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
