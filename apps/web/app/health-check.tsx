'use client';

import { HealthResponseSchema } from '@nuri/contracts';
import { useEffect, useState } from 'react';

type State = 'checking' | 'healthy' | 'unavailable';

export function HealthCheck() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/health`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body: unknown) => setState(HealthResponseSchema.safeParse(body).success ? 'healthy' : 'unavailable'))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === 'AbortError')) setState('unavailable'); });
    return () => controller.abort();
  }, []);

  return <section aria-live="polite"><span className={`status ${state}`} />API: {state}</section>;
}
