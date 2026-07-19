'use client';

import {
  ClientListResponseSchema,
  ClientSchema,
  CounselingRecordListResponseSchema,
  CounselingRecordSchema,
  type Client,
  type CounselingRecord,
  type CreateClientRequest,
  type CreateCounselingRecordRequest,
} from '@nuri/contracts';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiFetch } from '../lib/auth-api';

export type { Client, CounselingRecord } from '@nuri/contracts';
export type SessionDraft = Pick<CounselingRecord, 'clientId' | 'title' | 'sessionDate' | 'sessionType' | 'sessionNumber'>;

type CounselingStore = {
  clients: Client[];
  records: CounselingRecord[];
  sessionDraft: SessionDraft | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  load: () => Promise<void>;
  addClient: (input: CreateClientRequest) => Promise<Client>;
  addRecord: (clientId: string, input: CreateCounselingRecordRequest) => Promise<CounselingRecord>;
  setSessionDraft: (draft: SessionDraft | null) => void;
};

async function request(path: string, init?: RequestInit) {
  const response = await apiFetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

export const useCounselingStore = create<CounselingStore>()(
  persist(
    (set, get) => ({
      clients: [],
      records: [],
      sessionDraft: null,
      status: 'idle',
      error: null,
      load: async () => {
        if (get().status === 'loading' || get().status === 'ready') return;
        set({ status: 'loading', error: null });
        try {
          const clients = ClientListResponseSchema.parse(await request('/clients'));
          const recordGroups = await Promise.all(clients.map(async (client) =>
            CounselingRecordListResponseSchema.parse(await request(`/clients/${client.id}/records`)),
          ));
          set({ clients, records: recordGroups.flat(), status: 'ready' });
        } catch (error) {
          set({ status: 'error', error: error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.' });
        }
      },
      addClient: async (input) => {
        const client = ClientSchema.parse(await request('/clients', { method: 'POST', body: JSON.stringify(input) }));
        set((state) => ({ clients: [client, ...state.clients] }));
        return client;
      },
      addRecord: async (clientId, input) => {
        const record = CounselingRecordSchema.parse(await request(`/clients/${clientId}/records`, { method: 'POST', body: JSON.stringify(input) }));
        set((state) => ({ records: [record, ...state.records] }));
        return record;
      },
      setSessionDraft: (sessionDraft) => set({ sessionDraft }),
    }),
    {
      name: 'nuri-counseling-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ sessionDraft }) => ({ sessionDraft }),
    },
  ),
);
