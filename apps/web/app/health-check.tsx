'use client';

import { HealthResponseSchema } from '@nuri/contracts';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/auth-api';

type State = 'checking' | 'healthy' | 'unavailable';

const labels: Record<State, string> = {
  checking: '연결 확인 중',
  healthy: '모든 시스템 정상',
  unavailable: 'API 연결 안 됨',
};

export function HealthCheck() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((body: unknown) => {
        setState(HealthResponseSchema.safeParse(body).success ? 'healthy' : 'unavailable');
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setState('unavailable');
        }
      });
    return () => controller.abort();
  }, []);

  return <div className="api-status" aria-live="polite"><span className={`status ${state}`} />{labels[state]}</div>;
}
