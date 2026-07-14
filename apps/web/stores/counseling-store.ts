'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Client = {
  id: string;
  name: string;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  phoneNumber?: string;
  address?: string;
  protectionCategory?: string;
  householdType?: string;
  hasDisability?: string;
  longTermCare?: string;
  emergencyContact?: string;
  housingType?: string;
  housingOwnership?: string;
  familyRelationship?: string;
  familyName?: string;
  familyGender?: string;
  familyBirthDate?: string;
  familyOccupation?: string;
  familyCohabitation?: string;
  familyNotes?: string;
  createdAt: string;
};

export type CounselingRecord = {
  id: string;
  clientId: string;
  title: string;
  sessionDate: string;
  sessionType: string;
  sessionNumber?: number;
  presentingConcern: string;
  sessionContent: string;
  counselorObservation?: string;
  intervention?: string;
  riskLevel: 'none' | 'attention' | 'urgent';
  followUpPlan?: string;
  summaryStatus: 'not-requested' | 'pending' | 'completed';
  createdAt: string;
};

type CreateClientInput = Omit<Client, 'id' | 'createdAt'>;
type CreateRecordInput = Omit<CounselingRecord, 'id' | 'createdAt'>;
export type SessionDraft = Pick<CounselingRecord, 'clientId' | 'title' | 'sessionDate' | 'sessionType' | 'sessionNumber'>;

type CounselingStore = {
  clients: Client[];
  records: CounselingRecord[];
  sessionDraft: SessionDraft | null;
  hasHydrated: boolean;
  addClient: (input: CreateClientInput) => Client;
  addRecord: (input: CreateRecordInput) => CounselingRecord;
  setSessionDraft: (draft: SessionDraft | null) => void;
  setHasHydrated: (value: boolean) => void;
};

const demoClient: Client = {
  id: 'kim-minseo',
  name: '김민서',
  birthDate: '2008-03-18',
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
  createdAt: '2026-06-30T11:00:00+09:00',
};

const demoRecords: CounselingRecord[] = [
  {
    id: 'demo-record-3', clientId: demoClient.id, title: '7월 3주차 정기 상담', sessionDate: '2026-07-14T10:24:00+09:00', sessionType: 'individual', sessionNumber: 3,
    presentingConcern: '수면 패턴과 학교 적응', sessionContent: '최근 수면 시간이 조금씩 안정되고 있으며, 학교생활에서 느끼는 불안도 이전 회기보다 완화되었다고 보고함.', counselorObservation: '이전 회기보다 표정이 편안하고 대화 참여도가 높았음.', intervention: '생활 리듬의 긍정적 변화를 강화하고 불안 상황 기록 방법을 안내함.', riskLevel: 'none', followUpPlan: '일주일간 수면 기록과 불안이 높아지는 상황을 함께 기록하기', summaryStatus: 'completed', createdAt: '2026-07-14T10:24:00+09:00',
  },
  {
    id: 'demo-record-2', clientId: demoClient.id, title: '2차 상담 기록', sessionDate: '2026-07-07T14:00:00+09:00', sessionType: 'individual', sessionNumber: 2,
    presentingConcern: '등교 불안과 수면 문제', sessionContent: '수면 부족과 등교 전 긴장감의 연관성을 탐색하고 취침 전 사용할 수 있는 이완 방법을 함께 연습함.', riskLevel: 'none', followUpPlan: '취침 전 호흡 이완을 실천하고 효과를 기록하기', summaryStatus: 'completed', createdAt: '2026-07-07T14:00:00+09:00',
  },
  {
    id: 'demo-record-1', clientId: demoClient.id, title: '초기 상담 기록', sessionDate: '2026-06-30T11:00:00+09:00', sessionType: 'individual', sessionNumber: 1,
    presentingConcern: '결석과 불안감', sessionContent: '최근 반복되는 결석과 불안감을 주호소로 방문함. 현재 어려움과 가족 및 학교 내 지지체계를 확인함.', riskLevel: 'none', followUpPlan: '생활 리듬과 불안이 심해지는 시간대를 확인하기', summaryStatus: 'completed', createdAt: '2026-06-30T11:00:00+09:00',
  },
];

export const useCounselingStore = create<CounselingStore>()(
  persist(
    (set) => ({
      clients: [demoClient],
      records: demoRecords,
      sessionDraft: null,
      hasHydrated: false,
      addClient: (input) => {
        const client = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        set((state) => ({ clients: [...state.clients, client] }));
        return client;
      },
      addRecord: (input) => {
        const record = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        set((state) => ({ records: [record, ...state.records] }));
        return record;
      },
      setSessionDraft: (sessionDraft) => set({ sessionDraft }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nuri-counseling-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ clients, records, sessionDraft }) => ({ clients, records, sessionDraft }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
